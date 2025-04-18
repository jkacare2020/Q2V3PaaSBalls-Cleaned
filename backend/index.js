const express = require("express");
const admin = require("firebase-admin");
const inspect = require("util").inspect;
const Busboy = require("busboy").default || require("busboy");
const path = require("path");
const os = require("os");
const fs = require("fs");
const { v4: UUID } = require("uuid"); // Updated to use `uuid` package
const webpush = require("web-push");

const cors = require("cors");
// const mongoose = require("mongoose");
const connectDB = require("./db/mongooseConfig");
require("dotenv").config();

const speech = require("@google-cloud/speech");
const client = new speech.SpeechClient();
const { SpeechClient } = require("@google-cloud/speech");

//---------------------------------------------------------------
connectDB(); // Ensure the database is connected
//----------------------------------------------------------------
// Initialize Express app
const app = express(); // <-- Move this here to initialize app before using it

const User = require("./models/users/User");
const Transact = require("./models/transacts/Transacts");
// const Transaction = require("./models/transactions/Transaction");

/*
  config - cors
*/
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        // "https://guasar-jason2024.web.app",
        "http://localhost:9000",
      ];
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type, Authorization",
  })
);
//----------------------MongoDB---------------
app.get("/mongo-users", async (req, res) => {
  const authHeader = req.headers.authorization;

  // Check if the Authorization header is present
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send("Unauthorized access to users.");
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Check if the user is an admin
    const userIsAdmin = await isAdmin(userId); // Ensure `isAdmin` is defined correctly
    if (!userIsAdmin) {
      console.log("admin ?", userIsAdmin);
      return res.status(403).send("Forbidden: Admin access required.");
    }
    console.log("admin ?", userIsAdmin);
    // Fetch users data if the user is an admin
    const users = await User.find().select("-avatar -password -tokens");
    res.json(users);
    console.log("Fetching MongoDB users for admin user.");
  } catch (error) {
    console.error("Error fetching MongoDB users:", error);
    res.status(500).send("Error fetching users from MongoDB");
  }
});

//-------- Check admin -----------------------
async function isAdmin(userId) {
  try {
    const userRef = dbFirestore.collection("users").doc(userId);
    const doc = await userRef.get();
    if (!doc.exists) {
      console.log("User not found in Firestore.");
      return false; // User not found
    }
    return doc.data().role === "admin";
  } catch (error) {
    console.error("Failed to check admin status:", error);
    return false; // Handle errors or assume non-admin if error occurs
  }
}

//----------------------------MongoDB Transactions Admin--------------------
app.get("/mongo-transacts", async (req, res) => {
  const { phone } = req.query;
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send("Transacts Unauthorized");
  }

  const idToken = authHeader.split("Bearer ")[1];
  const decodedToken = await admin.auth().verifyIdToken(idToken);
  const userId = decodedToken.uid;
  //-----------------call isAdmin function --------
  const userIsAdmin = await isAdmin(userId);
  console.log("Is user Admin?", userIsAdmin);

  // Default to no filter
  let query = {};

  if (!userIsAdmin) {
    // Non-admins must provide a phone number
    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }
    const normalizedPhone = phone.replace(/\D/g, "");
    const phoneRegex = new RegExp(
      `.*${normalizedPhone.split("").join(".*")}.*`
    );
    query = { Phone_Number: phoneRegex };
  } else if (userIsAdmin && phone) {
    // Admin with a phone number filter
    const normalizedPhone = phone.replace(/\D/g, "");
    const phoneRegex = new RegExp(
      `.*${normalizedPhone.split("").join(".*")}.*`
    );
    query = { Phone_Number: phoneRegex };
  }

  console.log("Querying MongoDB with filter:", query);

  try {
    const transacts = await Transact.find(query).sort({
      req_date: -1,
      transact_number: -1,
    });
    if (transacts.length === 0) {
      return res.status(404).json({ message: "No transactions found" });
    }
    res.json(transacts);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).send("Error fetching transactions");
  }
});

//---------------------- Simple Get transacts Route --------

app.get("/mongo-transacts-Org", async (req, res) => {
  const { phone } = req.query;

  if (!phone) {
    return res.status(400).json({ message: "Phone number is required" });
  }

  // Normalize and remove non-numeric characters for comparison
  const normalizedPhone = phone.replace(/\D/g, "");
  const phoneRegex = new RegExp(`.*${normalizedPhone.split("").join(".*")}.*`);

  console.log("Searching for phone number regex:", phoneRegex);

  try {
    const transacts = await Transact.find({ Phone_Number: phoneRegex }).sort({
      req_date: -1,
    });

    if (transacts.length === 0) {
      return res
        .status(404)
        .json({ message: "No transactions found for the phone number" });
    }
    res.json(transacts);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).send("Error fetching transactions");
  }
});

//------------------------------------------------------

app.get("/mongo-transacts-backupOrg", async (req, res) => {
  const { phone } = req.query;

  if (!phone) {
    return res.status(400).json({ message: "Phone number is required" });
  }

  // Normalize and remove non-numeric characters for comparison
  const normalizedPhone = phone.replace(/\D/g, "");
  const phoneRegex = new RegExp(`.*${normalizedPhone.split("").join(".*")}.*`);

  console.log("Searching for phone number regex:", phoneRegex);

  try {
    const transacts = await Transact.find({ Phone_Number: phoneRegex }).sort({
      req_date: -1,
    });

    if (transacts.length === 0) {
      return res
        .status(404)
        .json({ message: "No transactions found for the phone number" });
    }
    res.json(transacts);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).send("Error fetching transactions");
  }
});
//--------------------------------------------------------------
app.get("/api/transacts/:id", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).send("Unauthorized");
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Fetch transaction by ID and ensure it belongs to the authenticated user
    const transactId = req.params.id;
    const transact = await db.collection("transactions").doc(transactId).get();

    if (!transact.exists || transact.data().userId !== userId) {
      return res.status(404).send("Transaction not found or unauthorized");
    }

    res.status(200).json(transact.data());
  } catch (error) {
    console.error("Error fetching transaction:", error);
    res.status(500).send("Internal server error");
  }
});
// ------------------------ mongoose.connection --------------(
// mongoose.connect(process.env.MONGODB_URL);

// const dbMongo = mongoose.connection;
// dbMongo.on("error", console.error.bind(console, "MongoDB connection error:"));
// dbMongo.once("open", function () {
//   console.log("Connected to MongoDB");
// });

/*
  config - webpush
*/
webpush.setVapidDetails(
  process.env.VAPID_CONTACT_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

/*
  config - firebase
*/
const serviceAccount = require("./firebase/serviceAccount");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),

  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

/*
  endpoint - fetch Firestore posts
*/
const dbFirestore = admin.firestore();
let bucket = admin.storage().bucket();

app.get("/posts", async (req, res) => {
  console.log("Received request to /posts"); // Log when a request is received
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("Authorization header missing or invalid");
      return res.status(401).send("Unauthorized");
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    const userId = decodedToken.uid;
    console.log("Post UserId :", userId);
    console.log("Post idToken :", idToken);

    let posts = [];
    const snapshot = await dbFirestore
      .collection("posts")
      .where("userId", "==", userId) // Filter posts by userId
      .orderBy("date", "desc")
      .get();

    snapshot.forEach((doc) => {
      posts.push({ id: doc.id, ...doc.data() });
    });

    res.send(posts);
  } catch (error) {
    console.error("Error fetching Firestore posts:", error);
    res.status(500).send("Error fetching posts");
  }
});

//----------------------------------------------------------
const { getFirestore } = require("firebase-admin/firestore");
const db = getFirestore(); // Initialize Firestore instance
// const { getAuth } = require("firebase-admin/auth");

app.delete("/posts/:id", async (req, res) => {
  const idToken = req.headers.authorization?.split(" ")[1];
  if (!idToken) {
    return res.status(401).send("Unauthorized: Missing Firebase token");
  }

  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const userId = decodedToken.uid;
    console.log(`Authenticated userId: ${userId}`);

    // Proceed to delete the post if userId matches post owner
    const postId = req.params.id;
    const postRef = dbFirestore.collection("posts").doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists || postDoc.data().userId !== userId) {
      return res
        .status(403)
        .send("Unauthorized: You can only delete your own posts");
    }

    await postRef.delete();
    res.status(200).send({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(401).send("Unauthorized: Invalid Firebase token");
  }
});

//-----------------------------------------------------------

const { getAuth } = require("firebase-admin/auth");

app.post("/createPost", async (request, response) => {
  console.log("Received a request to /createPost"); // Add this to check if request hits the server
  response.set("Access-Control-Allow-Origin", "*");

  const idToken = request.headers.authorization?.split(" ")[1];
  console.log("Received ID Token:", idToken);

  if (!idToken) {
    console.error("No Firebase token found in request");
    return response.status(401).send("Unauthorized: Missing Firebase token");
  }

  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);
    userId = decodedToken.uid;
    console.log("Authenticated userId:", userId); // Log the userId to confirm it’s being extracted
  } catch (error) {
    console.error("Error verifying token:", error);
    return response.status(401).send("Unauthorized: Invalid Firebase token");
  }

  // Proceed with the rest of the document creation logic
  const uuid = UUID(); // Use const if UUID result won't change
  const busboy = Busboy({ headers: request.headers }); // Updated syntax: remove 'new'

  let fields = {};
  let fileData = {};
  let imageUrl;

  busboy.on("file", function (fieldname, file, info) {
    const { filename, encoding, mimetype } = info;

    if (!filename) {
      console.error("No file provided");
      return;
    }

    console.log("Busboy received file:", filename);

    // Use path.join and ensure filename is properly used
    const filepath = path.join(os.tmpdir(), filename);
    file.pipe(fs.createWriteStream(filepath));

    // Store file metadata
    fileData = { filepath, mimetype };
  });

  busboy.on("field", function (fieldname, val) {
    console.log("Busboy received field:", fieldname, "value:", val);
    fields[fieldname] = val;
  });

  busboy.on("finish", function () {
    console.log("Busboy finished processing.");

    // Proceed with uploading the file to Firebase storage
    bucket.upload(
      fileData.filepath,
      {
        uploadType: "media",
        metadata: {
          metadata: {
            contentType: fileData.mimetype,
            firebaseStorageDownloadTokens: uuid,
          },
        },
      },
      (err, uploadedFile) => {
        if (!err) {
          createDocument(uploadedFile);
        } else {
          console.error("Error uploading file:", err);
          response.status(500).send("Error uploading file");
        }
      }
    );

    function createDocument(uploadedFile) {
      imageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${uploadedFile.name}?alt=media&token=${uuid}`;

      console.log("Document Data to be added:", {
        id: fields.id,
        caption: fields.caption,
        location: fields.location,
        date: parseInt(fields.date),
        imageUrl: imageUrl,
        userId: userId,
      });

      dbFirestore
        .collection("posts")
        .doc(fields.id)
        .set({
          id: fields.id,
          caption: fields.caption,
          location: fields.location,
          date: parseInt(fields.date),
          imageUrl: imageUrl,
          userId: userId,
        })
        .then(() => {
          response.send("Post added: " + fields.id);
        })
        .catch((error) => {
          console.error("Error creating document:", error);
          response.status(500).send("Error adding post");
        });
    }
  });

  request.pipe(busboy);
});

// const speech = require("@google-cloud/speech");
// const client = new speech.SpeechClient();

// const speech = require("@google-cloud/speech");

// const client = new speech.SpeechClient();

(async () => {
  const [response] = await client.recognize({
    config: {
      encoding: "LINEAR16",
      languageCode: "en-US",
      sampleRateHertz: 16000,
    },
    audio: { uri: "gs://your-bucket-name/audio-file.wav" },
  });
  console.log("Transcription:", response.results[0].alternatives[0].transcript);
})();

/*
  listen - start the server
*/
app.listen(process.env.PORT || 3000, () => {
  console.log("Server is running on port", process.env.PORT || 3000);
});
