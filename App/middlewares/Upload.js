const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dir;
    if (file.mimetype.startsWith('image/')) {
      dir = path.join(__dirname, '../../public/uploads/images');
    } else if (file.mimetype.startsWith('video/')) {
      dir = path.join(__dirname, '../../public/uploads/videos');
    } else {
      return cb(new Error('Invalid file type'), false);
    }

    // Create folder if not exist
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, Date.now() + ext);
  }
});

const upload = multer({ storage });
module.exports = upload;
