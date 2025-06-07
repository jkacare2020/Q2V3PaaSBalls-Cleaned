const admin = require("firebase-admin");

const bucket = admin.storage().bucket(); // Make sure Firebase is initialized already

/**
 * Uploads a PDF buffer to Firebase Storage and returns a public URL
 * @param {Buffer} buffer - PDF file buffer
 * @param {string} filename - Path in storage, e.g., 'vision-reports/session123.pdf'
 * @returns {Promise<string>} - Public download URL
 */
async function uploadPdfAndGetUrl(buffer, filename) {
  const file = bucket.file(filename);

  await file.save(buffer, {
    metadata: { contentType: "application/pdf" },
    public: true, // Make it accessible
  });

  const [url] = await file.getSignedUrl({
    action: "read",
    expires: "03-01-2030", // Adjust if needed
  });

  return url;
}

module.exports = { uploadPdfAndGetUrl };
