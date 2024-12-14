const express = require("express");
const Busboy = require("busboy").default || require("busboy");
const { processImage } = require("../controllers/imageProcessingController");
// const authorize = require("../middlewares/authorize");

const router = express.Router();

/**
 * Middleware to handle multipart/form-data using Busboy
 */
const handleMultipart = (req, res, next) => {
  const busboy = new Busboy({ headers: req.headers });
  req.body = {};
  req.file = {};

  busboy.on("file", (fieldname, file, info) => {
    const { filename, encoding, mimetype } = info;
    const filepath = path.join(os.tmpdir(), filename);
    const writeStream = fs.createWriteStream(filepath);

    file.pipe(writeStream);

    req.file = {
      path: filepath,
      filename,
      mimetype,
    };
  });

  busboy.on("field", (fieldname, val) => {
    req.body[fieldname] = val;
  });

  busboy.on("finish", () => {
    next();
  });

  req.pipe(busboy);
};

/**
 * @route POST /api/image-process
 * @desc Upload and process an image
 * @access Protected (Requires specific roles)
 */
router.post(
  "/image-process",
  // authorize(["admin", "owner", "salesman", "salesAgent", "user"]),
  handleMultipart,
  processImage
);

module.exports = router;
