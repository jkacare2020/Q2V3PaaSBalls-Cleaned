const admin = require("firebase-admin");
const { v4: uuidv4 } = require("uuid");
const dbFirestore = admin.firestore(); // Firestore instance
const bucket = admin.storage().bucket(); // Firebase Storage bucket

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
    });
    await docRef.set({
      id, // Firestore document ID
      userId,
      audioUrl,
      fileName,
      caption,
      date: new Date(),
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
    console.log("Audio id :", id);
    const audioDoc = await dbFirestore.collection("audios").doc(id).get();
    console.log("audioDoc: ", audioDoc);
    if (!audioDoc.exists) {
      console.error("Audio document not found in Firestore for ID:", id);
      return res.status(404).json({ error: "Audio not found" });
    }

    const data = audioDoc.data();
    console.log("Audio document data:", data);

    const { audioUrl } = audioDoc.data();
    console.log("Audio document data:", data);
    const filePath = decodeURIComponent(audioUrl.split("/o/")[1].split("?")[0]);

    if (!data.audioUrl) {
      console.error("audioUrl field missing in Firestore document for ID:", id);
      return res.status(400).json({ error: "audioUrl is missing" });
    }

    // Delete from Firebase Storage
    await bucket.file(filePath).delete();

    // Delete Firestore metadata
    await dbFirestore.collection("audios").doc(id).delete();

    res.status(200).json({ message: "Audio deleted successfully" });
  } catch (error) {
    console.error("Error deleting audio:", error);
    res.status(500).json({ error: "Failed to delete audio" });
  }
};
