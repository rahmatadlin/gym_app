const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for transfer receipt uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/transactions';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'receipt-' + uniqueSuffix + path.extname(file.originalname));
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

// Transaction routes
router.get('/', authenticateToken, transactionController.getAllTransactions);
router.get('/:id', authenticateToken, transactionController.getTransactionById);
router.post('/', authenticateToken, upload.single('transfer_receipt_image'), transactionController.createTransaction);
router.put('/:id', authenticateToken, upload.single('transfer_receipt_image'), transactionController.updateTransaction);
router.delete('/:id', authenticateToken, transactionController.deleteTransaction);

// Member-specific routes
router.get('/member/me', authenticateToken, transactionController.getMyTransactions);
router.post('/member/create', authenticateToken, upload.single('transfer_receipt_image'), transactionController.createMemberTransaction);

module.exports = router; 