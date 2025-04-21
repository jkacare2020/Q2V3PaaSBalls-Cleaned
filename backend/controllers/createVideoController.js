const { v4: UUID } = require("uuid");
const Busboy = require("busboy");
const path = require("path");
const os = require("os");
const fs = require("fs");
const admin = require("firebase-admin");

const bucket = admin.storage().bucket();
const dbFirestore = admin.firestore();

/**
 * Controller to handle creating a new post.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */

// Check if a user is an admin
async function isAdmin(userId) {
  try {
    const userRef = db.collection("users").doc(userId); // Firestore instance
    const doc = await userRef.get();
    if (!doc.exists) {
      console.log("User not found in Firestore.");
      return false;
    }
    return doc.data().role === "admin";
  } catch (error) {
    console.error("Failed to check admin status:", error);
    return false;
  }
}

exports.createVideoPost = (req, res) => {
  const idToken = req.headers.authorization?.split(" ")[1];
  console.log("videoController", idToken);

  if (!idToken) {
    return res.status(401).send("Unauthorized: Missing Firebase token");
  }

  admin
    .auth()
    .verifyIdToken(idToken)
    .then(async (decodedToken) => {
      const userId = decodedToken.uid;
      const userSnapshot = await dbFirestore
        .collection("users")
        .doc(userId)
        .get();
      const userData = userSnapshot.exists ? userSnapshot.data() : {};

      const uuid = UUID();
      const busboy = Busboy({ headers: req.headers });
      let fields = {};
      let fileData = {};

      busboy.on("file", (fieldname, file, info) => {
        console.log("File received:", fieldname, info);
        const { filename, mimetype } = info;
        const filepath = path.join(os.tmpdir(), filename);
        file.pipe(fs.createWriteStream(filepath));
        fileData = { filepath, filename, mimetype };
      });

      busboy.on("field", (fieldname, val) => {
        console.log("Field received:", fieldname, val);
        fields[fieldname] = val;
      });

      console.log("Incoming request to /create-video-post");
      console.log("Headers:", req.headers);
      console.log("Body:", req.body);

      busboy.on("finish", () => {
        console.log("File processing completed");
        if (!fileData.filepath) {
          return res.status(400).send("No file uploaded");
        }

        // Define the destination path in the "videos/" folder
        const destination = `videos/${fields.id}_${fileData.filename}`;

        // Upload video to Firebase Storage
        bucket.upload(
          fileData.filepath,
          {
            destination, // Save the file in the "videos/" folder
            uploadType: "media",
            metadata: {
              metadata: {
                contentType: fileData.mimetype,
                firebaseStorageDownloadTokens: uuid,
              },
            },
          },
          (err, uploadedFile) => {
            // Correctly access the uploaded file's metadata
            if (err) {
              console.error("Error uploading video:", err);
              return res.status(500).send("Error uploading video");
            }

            // Construct the correct video URL
            const videoUrl = `https://firebasestorage.googleapis.com/v0/b/${
              bucket.name
            }/o/${encodeURIComponent(
              uploadedFile.name
            )}?alt=media&token=${uuid}`;

            // Store the video data in Firestore
            const videoData = {
              id: fields.id,
              caption: fields.caption,
              location: fields.location,
              date: parseInt(fields.date),
              videoUrl,
              userId,
              tags: fields.tags ? fields.tags.split(",") : [],
              userName: userData.userName || "", // 👈 add this
              displayName: userData.displayName || "User", // 👈 and this
            };

            dbFirestore
              .collection("videos")
              .doc(fields.id)
              .set(videoData)
              .then(() => {
                console.log("Video post added:", videoData);
                res.send("Video post added");
              })
              .catch((error) => {
                console.error("Error adding video post:", error);
                res.status(500).send("Error adding video post");
              });
          }
        );
      });

      req.pipe(busboy);
    })
    .catch((error) => {
      console.error("Unauthorized error:", error);
      res.status(401).send("Unauthorized");
    });
};
