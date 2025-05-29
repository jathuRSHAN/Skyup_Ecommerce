const multer = require('multer');

const storage = multer.memoryStorage(); // Store in memory, not disk
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit to 5MB
});

module.exports = upload;