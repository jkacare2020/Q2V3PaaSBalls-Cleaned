// const { getStorage } = require("firebase-admin/storage");
// const { v4: uuidv4 } = require("uuid");

// /**
//  * Uploads an image to Firebase Storage and returns a public URL
//  * @param {object} file - multer file object with .buffer
//  * @param {string} folder - destination folder name
//  * @returns {string} Public download URL
//  */
// exports.uploadFileToStorage = async (file, folder = "vision-uploads") => {
//   const bucket = getStorage().bucket();
//   const fileName = `${folder}/${uuidv4()}-${file.originalname}`;
//   const fileUpload = bucket.file(fileName);

//   await fileUpload.save(file.buffer, {
//     metadata: {
//       contentType: file.mimetype,
//       metadata: {
//         firebaseStorageDownloadTokens: uuidv4(),
//       },
//     },
//   });

//   return `https://firebasestorage.googleapis.com/v0/b/${
//     bucket.name
//   }/o/${encodeURIComponent(fileName)}?alt=media`;
// };
const { getStorage } = require("firebase-admin/storage");
const { v4: uuidv4 } = require("uuid");

async function uploadImageAndGetUrl(file, path) {
  const bucket = getStorage().bucket();
  const filename = `${path}-${uuidv4()}`;
  const fileUpload = bucket.file(filename);

  await fileUpload.save(file.buffer, {
    metadata: {
      contentType: file.mimetype,
    },
  });

  const [url] = await fileUpload.getSignedUrl({
    action: "read",
    expires: "03-01-2030",
  });

  return url;
}

module.exports = {
  uploadImageAndGetUrl, // ✅ Make sure this line exists
};
