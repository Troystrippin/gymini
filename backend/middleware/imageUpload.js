const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (/^image\/(jpeg|png|webp|avif)$/.test(file.mimetype)) {
      return callback(null, true);
    }
    const error = new Error(
      "Only JPEG, PNG, WebP, and AVIF images are allowed",
    );
    error.status = 400;
    callback(error);
  },
});

module.exports = upload.single("image");
