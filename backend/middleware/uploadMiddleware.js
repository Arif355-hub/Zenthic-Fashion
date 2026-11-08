const multer = require("multer");

const allowedMimeTypes = [
  "image/png",
  "image/jpeg",
  "application/pdf",
];

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },

  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      const error = new Error("Only PNG, JPG, JPEG and PDF files are allowed.");

      error.status = 400;
      return cb(error);
    }

    cb(null, true);
  },
});

const validateArtworkFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    const { fileTypeFromBuffer } = await import("file-type");

    const isPdf =
      req.file.buffer.length >= 8 &&
      req.file.buffer
        .subarray(0, 5)
        .toString("ascii") === "%PDF-" &&
      req.file.buffer
        .subarray(-1024)
        .toString("latin1")
        .includes("%%EOF");

    const detectedType = isPdf
      ? { mime: "application/pdf" }
      : await fileTypeFromBuffer(req.file.buffer);

    const allowedMimeTypes = [
      "image/png",
      "image/jpeg",
      "application/pdf",
    ];

    if (
      !detectedType ||
      !allowedMimeTypes.includes(detectedType.mime)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid artwork file. Upload a genuine PNG, JPG or PDF.",
      });
    }

    req.file.detectedMimeType = detectedType.mime;

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { upload, validateArtworkFile };