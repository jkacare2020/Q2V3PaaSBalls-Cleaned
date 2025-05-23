// --postProductController.js --//
const PostProduct = require("../models/postProduct/PostProduct");
const admin = require("firebase-admin"); // Firebase Admin SDK
const db = admin.firestore();
const dbFirestore = admin.firestore();

exports.importFromFirebasePost = async (req, res) => {
  const postId = req.params.postId;

  console.log("🔍 postId:", postId);
  console.log("🔐 req.user:", req.user);
  console.log("📥 Request body:", req.body);

  try {
    // 1. Validate postId format (simple UUID v4 format check)
    if (!/^[\w-]{36}$/.test(postId)) {
      return res.status(400).json({ message: "Invalid postId format" });
    }

    // 2. Check if post already exists in MongoDB
    const existing = await PostProduct.findOne({ postId });
    if (existing) {
      // 🔹 Check for SendTo data
      if (req.body?.email && req.body?.passcode) {
        const alreadyGranted = existing.privateAccess?.some(
          (entry) => entry.email === req.body.email
        );

        if (!alreadyGranted) {
          existing.privateAccess.push({
            email: req.body.email,
            phone: req.body.phone,
            passcode: req.body.passcode,
            grantedBy: req.user?.uid || "unknown",
            grantedAt: new Date(),
          });
          await existing.save();
        }
      }

      return res.status(200).json(existing); // ✅ now with access list
    }

    // 3. Fetch the post from Firestore
    const doc = await dbFirestore.collection("posts").doc(postId).get();
    if (!doc.exists) {
      return res.status(404).json({ message: "Post not found in Firestore" });
    }

    const post = doc.data();

    // 4. Validate post fields
    if (!post.userId || typeof post.userId !== "string") {
      return res
        .status(400)
        .json({ message: "Invalid or missing userId in post" });
    }
    if (!post.caption || typeof post.caption !== "string") {
      return res
        .status(400)
        .json({ message: "Invalid or missing caption in post" });
    }

    // ✅ Validate post.tags if needed
    const postTags = Array.isArray(post.tags) ? post.tags : ["public"];

    // 5. Fetch user metadata
    const userDoc = await dbFirestore
      .collection("users")
      .doc(post.userId)
      .get();
    const userData = userDoc.exists ? userDoc.data() : {};
    const userRoles = Array.isArray(userData.role) ? userData.role : [];

    // 6. Combine tags
    const combinedTags = Array.from(new Set(["public", ...userRoles]));

    //-------------------------------------------------------
    if (postTags.includes("private") && postTags.includes("marketplace")) {
      console.warn("⚠️ Auto-correcting conflicting tags");
      postTags = postTags.filter((tag) => tag !== "marketplace"); // keep private only
    }
    // 7. Create product document
    const newProduct = new PostProduct({
      userId: post.userId,
      postId: postId,
      name: post.caption || "No name",
      description: "No description", // Optional: pull from post if it exists
      price: 0,
      imageUrl: post.imageUrl || "", // fallback if missing
      tags: postTags,
      role: userRoles,
      userName: userData.userName || "", // ✅ ADD THIS
      displayName: userData.displayName || "", // ✅ AND THIS
      companyName: userData.companyName || "", // ✅ AND THIS companyName
      //--------------------
      visibility: postTags.includes("private") ? "private" : "public",

      // ✅ Add this to capture access
      privateAccess:
        req.body?.email && req.body?.passcode
          ? [
              {
                email: req.body.email,
                phone: req.body.phone,
                passcode: req.body.passcode,
                grantedBy: req.user?.uid || "unknown",
                grantedAt: new Date(),
              },
            ]
          : [],
    });

    //-------------------------------------------------------
    await newProduct.save();
    console.log("✅ New product saved:", newProduct._id);
    return res.status(201).json(newProduct);
  } catch (err) {
    if (err.code === 11000) {
      const existing = await PostProduct.findOne({ postId });
      return res.status(200).json(existing);
    }
    console.error("🚨 Error importing post:", err.message);
    console.error(err.stack);
    return res
      .status(500)
      .json({ message: "Failed to import post", error: err.message });
  }
};

// CREATE
exports.createPostProduct = async (req, res) => {
  try {
    const {
      userId,
      tenantId,
      name,
      price,
      description,
      imageUrl,
      userName,
      displayName,
      companyName,
      postId,
      tags,
      category,
    } = req.body;

    const newProduct = new PostProduct({
      userId,
      tenantId,
      name,
      price,
      description,
      imageUrl,
      userName,
      displayName, // Include seller info directly
      companyName, //seller
    });

    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    console.error("Error saving product:", err);
    res.status(500).json({ message: "Failed to save product." });
  }
};
//-----------------------------------------------------
// ✅ Define and export the function in postProductController.js
// ✅ Firestore-based controller
exports.grantPrivateAccessToClientFirebase = async (req, res) => {
  const { postId } = req.params;
  const { email, passcode } = req.body;
  const merchantId = req.user?.uid;

  if (!merchantId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const postRef = admin.firestore().collection("posts").doc(postId);

    await postRef.set(
      {
        privateAccess: admin.firestore.FieldValue.arrayUnion({
          email,
          passcode,
          grantedBy: merchantId,
          grantedAt: new Date(),
        }),
      },
      { merge: true }
    );

    res.status(200).json({ message: "Access granted" });
  } catch (err) {
    console.error("Error granting access:", err);
    res.status(500).json({ message: "Failed to grant access" });
  }
};
//--------------------------------------------------------------------------
// exports.getPrivatePostsByClientFirebase = async (req, res) => {
//   const email = req.user?.email;
//   if (!email) return res.status(400).json({ message: "Missing email" });

//   try {
//     const snapshot = await admin.firestore().collection("posts").get();

//     const matched = snapshot.docs
//       .map((doc) => ({ id: doc.id, ...doc.data() }))
//       .filter((doc) =>
//         doc.privateAccess?.some((entry) => entry.email === email)
//       );

//     res.status(200).json(matched);
//   } catch (err) {
//     console.error("Fetch error:", err);
//     res.status(500).json({ message: "Failed to fetch private posts" });
//   }
// };
//--------------------------------------------------------------------
exports.getPrivatePostsByClientFirebase = async (req, res) => {
  const firebaseUser = req.user; // From Firebase Auth middleware
  const { email: queryEmail, passcode } = req.body;

  try {
    const snapshot = await admin.firestore().collection("posts").get();

    const matchedPosts = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((doc) => {
        const accessList = doc.privateAccess || [];

        // 🟢 Case 1: Logged-in Firebase user (match by UID)
        if (firebaseUser?.uid) {
          return accessList.some((entry) => entry.uid === firebaseUser.uid);
        }

        // 🔵 Case 2: Guest access via email + passcode
        if (queryEmail && passcode) {
          return accessList.some(
            (entry) => entry.email === queryEmail && entry.passcode === passcode
          );
        }

        // ❌ No valid access method
        return false;
      });

    if (matchedPosts.length === 0) {
      return res
        .status(403)
        .json({ message: "No matching private posts found" });
    }

    res.status(200).json(matchedPosts);
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ message: "Failed to fetch private posts" });
  }
};

//----------------------------Mongo version-----------------------

// POST /api/products/:id/grant-access
exports.grantPrivateAccessToClient = async (req, res) => {
  const { id } = req.params; // Mongo _id
  const { email, phone } = req.body;
  const merchantId = req.user?.uid;

  try {
    const product = await PostProduct.findById(id); // ✅ use real Mongo _id

    if (!product) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (!product.privateAccess) product.privateAccess = [];

    product.privateAccess.push({
      email,
      phone,
      grantedBy: merchantId,
      grantedAt: new Date(),
    });

    await product.save();
    res.status(200).json({ message: "Access granted successfully" });
  } catch (err) {
    console.error("MongoDB - Error granting access:", err);
    res.status(500).json({ message: "Failed to grant access" });
  }
};

//------------------get from MongoDB------// postProductController.js
exports.getPrivatePostsByClient = async (req, res) => {
  const { email, passcode } = req.query;

  if (!email || !passcode) {
    return res.status(400).json({ message: "Email and passcode required." });
  }

  try {
    const products = await PostProduct.find({
      visibility: "private",
      privateAccess: {
        $elemMatch: { email, passcode },
      },
    }).sort({ createdAt: -1 });

    res.status(200).json(products);
  } catch (err) {
    console.error("Error fetching private posts for client:", err);
    res.status(500).json({ message: "Server error" });
  }
};

//--------------------------------------------------------------

// READ - All
exports.getAllPostProducts = async (req, res) => {
  try {
    const products = await PostProduct.find().sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Failed to fetch products." });
  }
};
//---------------------------------------------------
// postProductController.js
exports.getMarketingMediaByUser = async (req, res) => {
  const userId = req.params.userId;
  console.log("userId :", userId);
  try {
    const marketingPosts = await PostProduct.find({
      userId,
      tags: { $in: ["merchant", "market", "marketing"] },
    });

    res.json({ posts: marketingPosts, videos: [] });
  } catch (err) {
    console.error("Error fetching marketing content:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getPostProductsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const products = await PostProduct.find({ userId });
    res.status(200).json(products); // ✅ Return array, not object
  } catch (error) {
    console.error("Error fetching user products:", error);
    res.status(500).json({ message: "Failed to fetch products." });
  }
};

// ----- READ - Single  ------------------------------------
exports.getPostProduct = async (req, res) => {
  try {
    const product = await PostProduct.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Failed to fetch product" });
  }
};
//--------------------------------------------------------------
// Get posts created by the current user
exports.getMyPosts = async (req, res) => {
  try {
    const userId = req.user.uid; // from authenticateAndAuthorize middleware

    const myPosts = await PostProduct.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json(myPosts);
  } catch (error) {
    console.error("Error fetching my posts:", error);
    res.status(500).json({ message: "Failed to fetch my posts" });
  }
};

// UPDATE
exports.updatePostProduct = async (req, res) => {
  try {
    const updated = await PostProduct.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!updated) return res.status(404).json({ message: "Product not found" });
    res.status(200).json(updated);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Failed to update product" });
  }
};

// DELETE
exports.deletePostProduct = async (req, res) => {
  try {
    const product = await PostProduct.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // ✅ Only allow the owner to delete
    if (product.userId !== req.user.uid) {
      return res
        .status(403)
        .json({ message: "You are not allowed to delete this product." });
    }

    await PostProduct.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Failed to delete product" });
  }
};

// controllers/postProductController.js
exports.getAllMarketplaceProducts = async (req, res) => {
  try {
    const products = await PostProduct.find({
      tags: { $in: ["marketplace"] },
    }).sort({ createdAt: -1 });

    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching marketplace products:", error);
    res.status(500).json({ message: "Failed to fetch marketplace products." });
  }
};
