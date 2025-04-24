const admin = require("firebase-admin");
const Busboy = require("busboy");
const os = require("os");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const bucket = admin.storage().bucket();
const db = admin.firestore();

exports.uploadBioFile = (req, res) => {
  const userId = req.body.uid || req.user?.uid;
  if (!userId) {
    console.error("❌ No userId in request");
    return res.status(400).send({ message: "Missing user ID" });
  }

  console.log("✅ uploadBioFile hit. UID:", userId);

  const busboy = Busboy({ headers: req.headers });
  let fileData = {};
  let bioUrl = ""; // ✅ define outside

  busboy.on("file", (fieldname, file, filenameInfo) => {
    const { filename, mimeType } = filenameInfo;
    console.log("📂 Received file:", filename, "Type:", mimeType);
    const filepath = path.join(os.tmpdir(), filename);
    file.pipe(fs.createWriteStream(filepath));
    fileData = { filepath, filename };
  });

  busboy.on("finish", () => {
    console.log("✅ Busboy finished");
    if (!fileData.filepath) {
      console.error("❌ No file received");
      return res.status(400).send({ message: "No file uploaded" });
    }

    const dest = `bios/${userId}_${fileData.filename}`;
    const token = uuidv4();

    bucket
      .upload(fileData.filepath, {
        destination: dest,
        metadata: {
          metadata: {
            firebaseStorageDownloadTokens: token,
            contentType: "application/octet-stream",
          },
        },
      })
      .then(([uploadedFile]) => {
        bioUrl = `https://firebasestorage.googleapis.com/v0/b/${
          bucket.name
        }/o/${encodeURIComponent(uploadedFile.name)}?alt=media&token=${token}`;

        console.log("✅ Uploaded to storage:", bioUrl);

        return db
          .collection("users")
          .doc(userId)
          .update({ bioFileUrl: bioUrl });
      })
      .then(() => {
        console.log("✅ Firestore updated with bio URL");
        res
          .status(200)
          .send({ message: "Bio uploaded successfully.", bioFileUrl: bioUrl });
      })
      .catch((err) => {
        console.error("❌ Upload failed:", err);
        res.status(500).send({ message: "Failed to upload bio." });
      });
  });

  req.pipe(busboy);
};

exports.getBioFile = async (req, res) => {
  const userId = req.params.userId || req.user?.uid;
  if (!userId) {
    console.error("❌ No userId found in request");
    return res.status(400).send({ message: "Missing user ID" });
  }

  console.log("✅ Handling bio upload for user:", userId);
  try {
    const doc = await db.collection("users").doc(userId).get();
    if (!doc.exists) return res.status(404).send({ message: "User not found" });
    const data = doc.data();
    if (!data.bioFileUrl)
      return res.status(404).send({ message: "Bio not uploaded" });
    res.redirect(data.bioFileUrl);
  } catch (err) {
    console.error("Error fetching bio:", err);
    res.status(500).send({ message: "Internal server error" });
  }
};

exports.deleteBioFile = async (req, res) => {
  const userId = req.body.uid || req.user?.uid;

  try {
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists)
      return res.status(404).send({ message: "User not found" });

    const bioFileUrl = userDoc.data().bioFileUrl;
    if (!bioFileUrl)
      return res.status(404).send({ message: "No bio file to delete" });

    // Extract Firebase Storage path
    const match = decodeURIComponent(bioFileUrl).match(/\/o\/(.+)\?alt=/);
    const filePath = match ? match[1] : null;

    if (!filePath)
      return res.status(400).send({ message: "Invalid file path" });

    await bucket.file(filePath).delete();
    await db.collection("users").doc(userId).update({ bioFileUrl: "" });

    res.status(200).send({ message: "Bio file deleted successfully." });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).send({ message: "Failed to delete bio file." });
  }
};
