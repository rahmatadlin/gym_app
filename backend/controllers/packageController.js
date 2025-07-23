const { Package } = require('../models');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/packages';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'package-' + uniqueSuffix + path.extname(file.originalname));
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
}).single('package_image');

// Get all packages
const getAllPackages = async (req, res) => {
  try {
    const packages = await Package.findAll({
      order: [['created_at', 'DESC']]
    });
    
    res.json(packages);
  } catch (error) {
    console.error('Error fetching packages:', error);
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
};

// Get package by ID
const getPackageById = async (req, res) => {
  try {
    const { id } = req.params;
    const package = await Package.findByPk(id);
    
    if (!package) {
      return res.status(404).json({ error: 'Package not found' });
    }
    
    res.json(package);
  } catch (error) {
    console.error('Error fetching package:', error);
    res.status(500).json({ error: 'Failed to fetch package' });
  }
};

// Create new package
const createPackage = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const { package_name, description, price, role, is_coaching_flag } = req.body;
      
      // Validate required fields
      if (!package_name || !price) {
        return res.status(400).json({ error: 'Package name and price are required' });
      }

      const packageData = {
        package_name,
        description,
        price: parseFloat(price),
        role: role || 'active',
        is_coaching_flag: is_coaching_flag === 'true' || is_coaching_flag === true
      };

      // Add image path if uploaded
      if (req.file) {
        packageData.package_image = req.file.path;
      }

      const newPackage = await Package.create(packageData);
      
      res.status(201).json(newPackage);
    } catch (error) {
      console.error('Error creating package:', error);
      res.status(500).json({ error: 'Failed to create package' });
    }
  });
};

// Update package
const updatePackage = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const { id } = req.params;
      const { package_name, description, price, role, is_coaching_flag } = req.body;
      
      const package = await Package.findByPk(id);
      if (!package) {
        return res.status(404).json({ error: 'Package not found' });
      }

      const updateData = {
        package_name,
        description,
        price: price ? parseFloat(price) : package.price,
        role: role || package.role,
        is_coaching_flag: is_coaching_flag !== undefined ? (is_coaching_flag === 'true' || is_coaching_flag === true) : package.is_coaching_flag
      };

      // Handle image update
      if (req.file) {
        // Delete old image if exists
        if (package.package_image && fs.existsSync(package.package_image)) {
          fs.unlinkSync(package.package_image);
        }
        updateData.package_image = req.file.path;
      }

      await package.update(updateData);
      
      res.json(package);
    } catch (error) {
      console.error('Error updating package:', error);
      res.status(500).json({ error: 'Failed to update package' });
    }
  });
};

// Delete package
const deletePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const package = await Package.findByPk(id);
    
    if (!package) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // Delete image file if exists
    if (package.package_image && fs.existsSync(package.package_image)) {
      fs.unlinkSync(package.package_image);
    }

    await package.destroy();
    
    res.json({ message: 'Package deleted successfully' });
  } catch (error) {
    console.error('Error deleting package:', error);
    res.status(500).json({ error: 'Failed to delete package' });
  }
};

// Get package image
const getPackageImage = async (req, res) => {
  try {
    const { id } = req.params;
    const package = await Package.findByPk(id);
    
    if (!package || !package.package_image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    if (!fs.existsSync(package.package_image)) {
      return res.status(404).json({ error: 'Image file not found' });
    }

    res.sendFile(path.resolve(package.package_image));
  } catch (error) {
    console.error('Error serving package image:', error);
    res.status(500).json({ error: 'Failed to serve image' });
  }
};

module.exports = {
  getAllPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage,
  getPackageImage
}; 