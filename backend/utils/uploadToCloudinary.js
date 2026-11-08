const cloudinary = require("../config/cloudinary");

const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    if (!Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
      return reject(new Error("Invalid artwork file buffer."));
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "zenthic-fashion/artwork",
        resource_type: "auto",
        use_filename: false,
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        if (!result || !result.secure_url || !result.public_id) {
          return reject(
            new Error("Cloudinary returned an invalid upload response.")
          );
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
};

module.exports = uploadToCloudinary;