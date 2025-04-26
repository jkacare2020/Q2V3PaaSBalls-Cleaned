const { v4: UUID } = require("uuid");
const Busboy = require("busboy");
const path = require("path");
const os = require("os");
const fs = require("fs");
const admin = require("firebase-admin");

const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");

ffmpeg.setFfmpegPath(ffmpegPath); // 🛠️ Tell fluent-ffmpeg where ffmpeg binary is

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
        const { filename, mimeType } = info;
        const filepath = path.join(os.tmpdir(), filename);

        const writeStream = fs.createWriteStream(filepath);
        file.pipe(writeStream); // ✅ THIS IS REQUIRED

        fileData = { filepath, filename, mimeType, ready: false };

        writeStream.on("close", () => {
          fileData.ready = true;
          console.log("✅ File fully written:", filepath);
        });
      });

      busboy.on("field", (fieldname, val) => {
        console.log("Field received:", fieldname, val);
        fields[fieldname] = val;
      });

      console.log("Incoming request to /create-video-post");
      console.log("Headers:", req.headers);
      console.log("Body:", req.body);

      busboy.on("finish", async () => {
        console.log("File processing completed");

        if (!fileData.filepath) {
          return res.status(400).send("No file uploaded");
        }

        const tempConvertedPath = path.join(
          os.tmpdir(),
          `${fields.id}_converted.mp4`
        );
        const tempPosterPath = path.join(
          os.tmpdir(),
          `${fields.id}_poster.png`
        );

        try {
          console.log("🎥 Re-encoding video to real MP4...");
          await new Promise((resolve, reject) => {
            ffmpeg(fileData.filepath)
              .outputOptions([
                "-c:v libx264",
                "-preset veryfast",
                "-movflags +faststart",
              ])
              .output(tempConvertedPath)
              .on("end", resolve)
              .on("error", reject)
              .run();
          });

          console.log("✅ Video re-encoded:", tempConvertedPath);

          console.log("📸 Extracting poster frame...");
          await new Promise((resolve, reject) => {
            ffmpeg(tempConvertedPath)
              .screenshots({
                timestamps: ["00:00:01"],
                filename: path.basename(tempPosterPath),
                folder: path.dirname(tempPosterPath),
                size: "640x360",
              })
              .on("end", resolve)
              .on("error", reject);
          });

          console.log("✅ Poster generated:", tempPosterPath);

          // ✅ Upload video and poster...
          const uuidVideo = UUID();
          const uuidPoster = UUID();

          const [videoUpload] = await bucket.upload(tempConvertedPath, {
            destination: `videos/${fields.id}.mp4`,
            metadata: {
              metadata: {
                contentType: "video/mp4",
                firebaseStorageDownloadTokens: uuidVideo,
              },
            },
          });

          const [posterUpload] = await bucket.upload(tempPosterPath, {
            destination: `videos/${fields.id}_poster.png`,
            metadata: {
              metadata: {
                contentType: "image/png",
                firebaseStorageDownloadTokens: uuidPoster,
              },
            },
          });

          const videoUrl = `https://firebasestorage.googleapis.com/v0/b/${
            bucket.name
          }/o/${encodeURIComponent(
            videoUpload.name
          )}?alt=media&token=${uuidVideo}`;
          const posterUrl = `https://firebasestorage.googleapis.com/v0/b/${
            bucket.name
          }/o/${encodeURIComponent(
            posterUpload.name
          )}?alt=media&token=${uuidPoster}`;

          const videoData = {
            id: fields.id,
            caption: fields.caption,
            location: fields.location,
            date: parseInt(fields.date),
            videoUrl,
            posterUrl,
            userId,
            tags: fields.tags ? fields.tags.split(",") : [],
            userName: userData.userName || "",
            displayName: userData.displayName || "User",
          };

          await dbFirestore.collection("videos").doc(fields.id).set(videoData);

          console.log("✅ Video post added to Firestore:", videoData);

          res.send("Video post added successfully!");
        } catch (error) {
          console.error("🚨 Error processing video:", error);
          if (!res.headersSent) {
            res.status(500).send("Error processing video");
          }
        } finally {
          try {
            if (fs.existsSync(tempConvertedPath))
              fs.unlinkSync(tempConvertedPath);
            if (fs.existsSync(tempPosterPath)) fs.unlinkSync(tempPosterPath);
            if (fs.existsSync(fileData.filepath))
              fs.unlinkSync(fileData.filepath);
            console.log("🧹 Temp files cleaned up!");
          } catch (cleanupError) {
            console.error("⚠️ Temp cleanup failed:", cleanupError);
          }
        }
      });

      req.pipe(busboy);
    })
    .catch((error) => {
      console.error("Unauthorized error:", error);
      res.status(401).send("Unauthorized");
    });
};
