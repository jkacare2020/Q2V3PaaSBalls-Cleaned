const admin = require("firebase-admin");
const { v4: uuidv4 } = require("uuid");
const dbFirestore = admin.firestore(); // Firestore instance
const bucket = admin.storage().bucket(); // Firebase Storage bucket

const niceDate = (value) => {
  if (!value) return "No date available";

  // 🔥 Firestore Timestamp object check
  if (value.seconds) {
    value = new Date(value.seconds * 1000); // convert Firestore timestamp to JS Date
  }

  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return "Invalid Date";

  return date.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
};

// Upload Audio
exports.uploadAudio = async (req, res) => {
  console.log("Backend uploadAudio function called");

  try {
    const { audioData, fileName, userId, caption } = req.body;

    // Validate request data
    if (!audioData || !fileName || !userId || !caption) {
      return res.status(400).json({ error: "Invalid request data" });
    }

    // Check for duplicate entry
    const duplicateQuery = await dbFirestore
      .collection("audios")
      .where("userId", "==", userId)
      .where("fileName", "==", fileName)
      .limit(1)
      .get();

    if (!duplicateQuery.empty) {
      console.log("Duplicate audio detected. Skipping save.");
      return res.status(409).json({ error: "Duplicate audio detected" });
    }

    // 🛠️ Fetch userData
    const userDoc = await dbFirestore.collection("users").doc(userId).get();
    let userData = {};
    if (userDoc.exists) {
      userData = userDoc.data();
    } else {
      console.warn(`⚠️ No user profile found for UID: ${userId}`);
    }

    // Create a new document reference (to generate doc.id first)
    const docRef = dbFirestore.collection("audios").doc();

    // Use Firestore document ID as the unique ID
    const id = docRef.id;

    // Upload to Firebase Storage
    const filePath = `audios/${id}_${fileName}`;
    const file = bucket.file(filePath);

    console.log("Uploading file to Firebase Storage:", filePath);
    await file.save(Buffer.from(audioData, "base64"), {
      metadata: {
        contentType: "audio/wav",
        metadata: {
          firebaseStorageDownloadTokens: uuidv4(),
        },
      },
    });

    // Get the download URL
    const audioUrl = `https://firebasestorage.googleapis.com/v0/b/${
      bucket.name
    }/o/${encodeURIComponent(filePath)}?alt=media`;

    // Save metadata to Firestore
    console.log("Saving metadata to Firestore:", {
      id,
      userId,
      audioUrl,
      fileName,
      caption,
      userName: userData.userName,
      displayName: userData.displayName,
    });
    await docRef.set({
      id, // Firestore document ID
      userId,
      audioUrl,
      fileName,
      caption,
      date: new Date(),
      userName: userData.userName || "", // 👈 add this
      displayName: userData.displayName || "User", // 👈 and this
    });

    console.log("Audio uploaded and metadata saved to Firestore:", id);
    res
      .status(200)
      .json({ message: "Audio uploaded successfully", audioUrl, id });
  } catch (error) {
    console.error("Error uploading audio:", error);
    res.status(500).json({ error: "Failed to upload audio" });
  }
};

exports.getAllAudios = async (req, res) => {
  try {
    const audiosSnapshot = await dbFirestore
      .collection("audios")
      .orderBy("date", "desc")
      .get();

    const audios = audiosSnapshot.docs.map((doc) => {
      const audioData = doc.data();

      return {
        ...audioData, // Spread document data first
        id: doc.id, // Then override `id` with Firestore document ID
        formattedDate: niceDate(audioData.date), // ✅ add this field
      };
    });

    res.status(200).json(audios);
  } catch (error) {
    console.error("Error fetching audios:", error);
    res.status(500).json({ error: "Failed to fetch audios" });
  }
};

// Get Audio Metadata
exports.getAudio = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await dbFirestore.collection("audios").doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Audio not found" });
    }

    res.status(200).json(doc.data());
  } catch (error) {
    console.error("Error fetching audio:", error);
    res.status(500).json({ error: "Failed to fetch audio" });
  }
};

// Delete Audio
exports.deleteAudio = async (req, res) => {
  try {
    const { id } = req.params;
    const requesterUid = req.user.uid;

    const audioDoc = await dbFirestore.collection("audios").doc(id).get();
    if (!audioDoc.exists) {
      return res.status(404).json({ error: "Audio not found" });
    }

    const data = audioDoc.data();

    // ✅ Check if requester is admin
    const userDoc = await dbFirestore
      .collection("users")
      .doc(requesterUid)
      .get();
    const isAdmin = userDoc.exists && userDoc.data().role === "admin";

    // ❌ Not owner or admin
    if (!isAdmin && data.userId !== requesterUid) {
      return res.status(403).json({ error: "Forbidden: Not your audio file." });
    }

    // ✅ Proceed with delete
    const filePath = decodeURIComponent(
      data.audioUrl.split("/o/")[1].split("?")[0]
    );

    await bucket.file(filePath).delete();
    await dbFirestore.collection("audios").doc(id).delete();

    res.status(200).json({ message: "Audio deleted successfully" });
  } catch (error) {
    console.error("Error deleting audio:", error);
    res.status(500).json({ error: "Failed to delete audio" });
  }
};
