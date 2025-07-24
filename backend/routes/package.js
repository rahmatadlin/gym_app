const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');
const { authenticateToken } = require('../middleware/auth');

// Get all packages
router.get('/', packageController.getAllPackages);


// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get package by ID
router.get('/:id', packageController.getPackageById);

// Create new package
router.post('/', packageController.createPackage);

// Update package
router.put('/:id', packageController.updatePackage);

// Delete package
router.delete('/:id', packageController.deletePackage);

// Get package image
router.get('/:id/image', packageController.getPackageImage);

module.exports = router; 