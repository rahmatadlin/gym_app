const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/role');

// Auth
router.post('/register', validate.register, userController.register);
router.post('/login', validate.login, userController.login);

// CRUD (protected)
router.get('/', auth, userController.getAllUsers);
router.get('/:id', auth, userController.getUserById);
router.post('/', auth, isAdmin, userController.createUser);
router.put('/:id', auth, isAdmin, userController.updateUser);
router.delete('/:id', auth, isAdmin, userController.deleteUser);

module.exports = router; 