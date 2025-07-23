const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/role');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Auth
router.post('/register', upload.single('user_image'), validate.register, userController.register);
router.post('/login', validate.login, userController.login);

// CRUD (protected)
router.get('/', auth, userController.getAllUsers);
router.get('/:id', auth, userController.getUserById);
router.post('/', auth, isAdmin, upload.single('user_image'), userController.createUser);
router.put('/:id', auth, isAdmin, upload.single('user_image'), userController.updateUser);
router.delete('/:id', auth, isAdmin, userController.deleteUser);

module.exports = router; 