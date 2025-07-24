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

// Helper function to convert file path to URL path
const getPackageImageUrl = (filePath) => {
  if (!filePath) return null;
  // Convert file system path to URL path
  // From: uploads/packages/filename.jpg
  // To: /uploads/packages/filename.jpg
  return '/' + filePath.replace(/\\/g, '/');
};

// Get all packages
const getAllPackages = async (req, res) => {
  try {
    const packages = await Package.findAll({
      order: [['id', 'ASC']]
    });
    
    res.json(packages);
  } catch (error) {
    console.error('Error fetching packages:', error);
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
};

// Get package by id
const getPackageById = async (req, res) => {
  try {
    const package = await Package.findByPk(req.params.id);
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
      const { package_name, description, price, package_status, duration, is_coaching_flag } = req.body;
      
      // Validate required fields
      if (!package_name || !price) {
        return res.status(400).json({ error: 'Package name and price are required' });
      }

      const packageData = {
        package_name,
        description,
        price: parseFloat(price),
        package_status: package_status || 'active',
        duration: duration ? parseInt(duration) : 30,
        is_coaching_flag: is_coaching_flag === 'true' || is_coaching_flag === true
      };

      // Add image URL path if uploaded
      if (req.file) {
        packageData.package_image = getPackageImageUrl(req.file.path);
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
      const { package_name, description, price, package_status, duration, is_coaching_flag } = req.body;
      
      const package = await Package.findByPk(id);
      if (!package) {
        return res.status(404).json({ error: 'Package not found' });
      }

      const updateData = {
        package_name,
        description,
        price: price ? parseFloat(price) : package.price,
        package_status: package_status || package.package_status,
        duration: duration ? parseInt(duration) : package.duration,
        is_coaching_flag: is_coaching_flag !== undefined ? (is_coaching_flag === 'true' || is_coaching_flag === true) : package.is_coaching_flag
      };

      // Handle image update
      if (req.file) {
        // Delete old image if exists
        if (package.package_image) {
          const oldImagePath = package.package_image.replace(/^\//, ''); // Remove leading slash
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
        updateData.package_image = getPackageImageUrl(req.file.path);
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
    if (package.package_image) {
      const imagePath = package.package_image.replace(/^\//, ''); // Remove leading slash
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await package.destroy();
    
    // Reset auto-increment after deletion
    await Package.sequelize.query(`
      SELECT setval(pg_get_serial_sequence('"Packages"', 'id'), (SELECT COALESCE(MAX(id), 0) + 1 FROM "Packages"));
    `);
    
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

    const imagePath = package.package_image.replace(/^\//, ''); // Remove leading slash
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ error: 'Image file not found' });
    }

    res.sendFile(path.resolve(imagePath));
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