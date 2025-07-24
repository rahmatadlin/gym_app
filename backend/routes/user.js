const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const validate = require('../middleware/validate');
const { authenticateToken } = require('../middleware/auth');
const isAdmin = require('../middleware/role');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for user image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/users';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'user-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Auth
router.post('/register', upload.single('user_image'), validate.register, userController.register);
router.post('/login', userController.login);

// User management (admin only)
router.get('/', authenticateToken, isAdmin, userController.getAllUsers);
router.get('/:id', authenticateToken, isAdmin, userController.getUserById);
router.post('/', authenticateToken, isAdmin, upload.single('user_image'), userController.createUser);
router.put('/:id', authenticateToken, isAdmin, upload.single('user_image'), userController.updateUser);
router.delete('/:id', authenticateToken, isAdmin, userController.deleteUser);

module.exports = router; 