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
exports.createPost = (req, res) => {
  console.log("Received a request to /createPost");

  const idToken = req.headers.authorization?.split(" ")[1];
  if (!idToken) {
    console.error("No Firebase token found in request");
    return res.status(401).send("Unauthorized: Missing Firebase token");
  }

  let userId;

  // Verify Firebase ID token
  admin
    .auth()
    .verifyIdToken(idToken)
    .then((decodedToken) => {
      userId = decodedToken.uid;
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
        fileData = { filepath, mimetype };
      });

      busboy.on("field", (fieldname, val) => {
        fields[fieldname] = val;
      });

      busboy.on("finish", () => {
        if (!fileData.filepath) {
          return res.status(400).send("No file uploaded");
        }

        // Upload file to Firebase Storage
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
            if (err) {
              console.error("Error uploading file:", err);
              return res.status(500).send("Error uploading file");
            }

            const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${uploadedFile.name}?alt=media&token=${uuid}`;
            const postData = {
              id: fields.id,
              caption: fields.caption,
              location: fields.location,
              date: parseInt(fields.date),
              imageUrl,
              userId,
            };

            dbFirestore
              .collection("posts")
              .doc(fields.id)
              .set(postData)
              .then(() => {
                console.log("Post added:", postData);
                res.send("Post added: " + fields.id);
              })
              .catch((error) => {
                console.error("Error creating document:", error);
                res.status(500).send("Error adding post");
              });
          }
        );
      });

      req.pipe(busboy);
    })
    .catch((error) => {
      console.error("Error verifying token:", error);
      res.status(401).send("Unauthorized: Invalid Firebase token");
    });
};
