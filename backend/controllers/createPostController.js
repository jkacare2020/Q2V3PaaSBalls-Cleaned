const { v4: UUID } = require("uuid");
const Busboy = require("busboy");
const path = require("path");
const os = require("os");
const fs = require("fs");
const admin = require("firebase-admin");
const sharp = require("sharp"); // ✅ For backend image resizing

const bucket = admin.storage().bucket();
const dbFirestore = admin.firestore();

/**
 * Controller to handle creating a new post.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
exports.createPost = async (req, res) => {
  console.log("Received a request to /createPost");

  const idToken = req.headers.authorization?.split(" ")[1];
  if (!idToken) {
    console.error("No Firebase token found in request");
    return res.status(401).send("Unauthorized: Missing Firebase token");
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;
    console.log("Authenticated userId:", userId);

    const uuid = UUID();
    const busboy = Busboy({ headers: req.headers });
    let fields = {};
    let fileData = {};

    busboy.on("file", (fieldname, file, info) => {
      const { filename, mimetype } = info;
      if (!filename) {
        console.error("No file provided");
        return;
      }

      const filepath = path.join(os.tmpdir(), filename);
      file.pipe(fs.createWriteStream(filepath));
      fileData = { filepath, mimetype, filename };
    });

    busboy.on("field", (fieldname, val) => {
      fields[fieldname] = val;
    });

    busboy.on("finish", async () => {
      if (!fileData.filepath) {
        return res.status(400).send("No file uploaded");
      }
      //-------------make avatar from photo uploaded wit htag avatar ----------------
      try {
        let finalPath = fileData.filepath;

        if (fields.tags && fields.tags.includes("avatar")) {
          const resizedPath = path.join(
            os.tmpdir(),
            `resized-${fileData.filename}`
          );
          await sharp(fileData.filepath).resize(256, 256).toFile(resizedPath);
          finalPath = resizedPath;
        }

        const [uploadedFile] = await bucket.upload(finalPath, {
          uploadType: "media",
          metadata: {
            metadata: {
              contentType: fileData.mimetype,
              firebaseStorageDownloadTokens: uuid,
            },
          },
        });

        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${uploadedFile.name}?alt=media&token=${uuid}`;
        const postData = {
          id: fields.id,
          caption: fields.caption,
          location: fields.location,
          date: parseInt(fields.date),
          imageUrl,
          userId,
          tags: fields.tags ? fields.tags.split(",") : [],
        };

        await dbFirestore.collection("posts").doc(fields.id).set(postData);
        console.log("Post added:", postData);

        if (postData.tags.includes("avatar")) {
          const avatarData = {
            imageUrl,
            uploadedAt: Date.now(),
            userId,
          };
          await dbFirestore
            .collection("users")
            .doc(userId)
            .collection("avatar")
            .add(avatarData);
          console.log("✅ Avatar metadata saved under /users/{userId}/avatar");
        }

        res.send("Post added: " + fields.id);
      } catch (uploadErr) {
        console.error("Image processing or upload error:", uploadErr);
        res.status(500).send("Error processing image");
      }
    });

    req.pipe(busboy);
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(401).send("Unauthorized: Invalid Firebase token");
  }
};
