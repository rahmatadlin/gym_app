const { User } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

// Helper function to save uploaded file
const saveUploadedFile = (file) => {
  if (!file) return null;
  
  const uploadsDir = path.join(__dirname, '../uploads');
  const fileName = `${Date.now()}-${file.originalname}`;
  const filePath = path.join(uploadsDir, fileName);
  
  // Move file to uploads directory
  fs.renameSync(file.path, filePath);
  
  // Return the URL path
  return `/uploads/${fileName}`;
};

module.exports = {
  // Register
  async register(req, res) {
    try {
      const { username, password, name, phone_number, gender, address, role, date_of_birth } = req.body;
      const existing = await User.findOne({ where: { username } });
      if (existing) return res.status(400).json({ message: 'Username already exists' });
      
      const hash = await bcrypt.hash(password, 10);
      
      // Handle image upload
      const user_image = req.file ? saveUploadedFile(req.file) : null;
      
      const user = await User.create({ 
        username, 
        password: hash, 
        name, 
        phone_number, 
        gender, 
        address, 
        role, 
        user_image,
        date_of_birth
      });
      
      res.status(201).json({ 
        message: 'User registered', 
        user: { 
          id: user.id, 
          username: user.username, 
          role: user.role,
          name: user.name,
          user_image: user.user_image
        } 
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // Login
  async login(req, res) {
    try {
      const { username, password } = req.body;
      const user = await User.findOne({ where: { username } });
      if (!user) return res.status(400).json({ message: 'Invalid credentials' });
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(400).json({ message: 'Invalid credentials' });
      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
      res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // Get all users
  async getAllUsers(req, res) {
    try {
      const users = await User.findAll({ 
        attributes: { exclude: ['password'] },
        order: [['created_at', 'ASC']]
      });
      res.json(users);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // Get user by id
  async getUserById(req, res) {
    try {
      const user = await User.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.json(user);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // Create user (admin only)
  async createUser(req, res) {
    try {
      console.log('Create user request body:', req.body);
      console.log('Create user request file:', req.file);
      
      const { username, password, name, phone_number, gender, address, role, date_of_birth } = req.body || {};
      
      // Check if username already exists
      const existing = await User.findOne({ where: { username } });
      if (existing) return res.status(400).json({ message: 'Username already exists' });
      
      const hash = await bcrypt.hash(password, 10);
      
      // Handle image upload
      const user_image = req.file ? saveUploadedFile(req.file) : null;
      
      const user = await User.create({ 
        username, 
        password: hash, 
        name, 
        phone_number, 
        gender, 
        address, 
        role, 
        user_image,
        date_of_birth
      });
      
      res.status(201).json({ 
        message: 'User created successfully', 
        user: { 
          id: user.id, 
          username: user.username, 
          name: user.name,
          role: user.role,
          user_image: user.user_image
        } 
      });
    } catch (err) {
      console.error('Create user error:', err);
      res.status(500).json({ message: err.message });
    }
  },

  // Update user
  async updateUser(req, res) {
    try {
      console.log('Request body:', req.body);
      console.log('Request file:', req.file);
      
      const { username, password, name, phone_number, gender, address, role, date_of_birth } = req.body || {};
      const user = await User.findByPk(req.params.id);
      
      if (!user) return res.status(404).json({ message: 'User not found' });
      
      // Check if username is being changed and if it already exists
      if (username && username !== user.username) {
        const existing = await User.findOne({ where: { username } });
        if (existing) return res.status(400).json({ message: 'Username already exists' });
      }
      
      // Prepare update data
      const updateData = { name, phone_number, gender, address, role, date_of_birth };
      
      // Only update username if provided
      if (username) {
        updateData.username = username;
      }
      
      // Only hash and update password if provided
      if (password && password.trim() !== '') {
        updateData.password = await bcrypt.hash(password, 10);
      }
      
      // Handle image upload if new file is provided
      if (req.file) {
        // Delete old image if exists
        if (user.user_image) {
          const oldImagePath = path.join(__dirname, '..', user.user_image);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
        updateData.user_image = saveUploadedFile(req.file);
      }
      
      await user.update(updateData);
      
      res.json({ 
        message: 'User updated successfully', 
        user: { 
          id: user.id, 
          username: user.username, 
          name: user.name,
          role: user.role,
          user_image: user.user_image
        } 
      });
    } catch (err) {
      console.error('Update user error:', err);
      res.status(500).json({ message: err.message });
    }
  },

  // Delete user
  async deleteUser(req, res) {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      
      // Delete user image if exists
      if (user.user_image) {
        const imagePath = path.join(__dirname, '..', user.user_image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
      
      await user.destroy();
      res.json({ message: 'User deleted successfully' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
}; 