require("dotenv").config();

const { v2: cloudinary } = require("cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadImage = (buffer, folder) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: "image",
          allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"],
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      )
      .end(buffer);
  });

const deleteImage = async (publicId) => {
  if (!publicId) return;
  return cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true,
  });
};

module.exports = { cloudinary, uploadImage, deleteImage };
