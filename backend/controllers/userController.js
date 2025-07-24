const { User } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

// Helper function to convert file path to URL path
const getUserImageUrl = (filePath) => {
  if (!filePath) return null;
  // Convert file system path to URL path
  // From: uploads/users/filename.jpg
  // To: /uploads/users/filename.jpg
  return '/' + filePath.replace(/\\/g, '/');
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
      const user_image = req.file ? getUserImageUrl(req.file.path) : null;
      
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
      
      // Generate JWT token after successful registration
      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
      
      res.status(201).json({ 
        message: 'User registered successfully', 
        token,
        user: { 
          id: user.id, 
          username: user.username, 
          role: user.role,
          name: user.name,
          phone_number: user.phone_number,
          date_of_birth: user.date_of_birth,
          gender: user.gender,
          address: user.address,
          user_image: user.user_image,
          created_at: user.created_at,
          updated_at: user.updated_at
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
      res.json({ 
        token, 
        user: { 
          id: user.id, 
          username: user.username, 
          role: user.role,
          name: user.name,
          phone_number: user.phone_number,
          date_of_birth: user.date_of_birth,
          gender: user.gender,
          address: user.address,
          user_image: user.user_image,
          created_at: user.created_at,
          updated_at: user.updated_at
        } 
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // Get current user profile
  async getCurrentUser(req, res) {
    try {
      const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.json(user);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // Get all users
  async getAllUsers(req, res) {
    try {
      const users = await User.findAll({ 
        attributes: { exclude: ['password'] },
        order: [['id', 'ASC']]
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
      const user_image = req.file ? getUserImageUrl(req.file.path) : null;
      
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
          const oldImagePath = user.user_image.replace(/^\//, ''); // Remove leading slash
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
        updateData.user_image = getUserImageUrl(req.file.path);
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
      
      // Delete image file if exists
      if (user.user_image) {
        const imagePath = user.user_image.replace(/^\//, ''); // Remove leading slash
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
      
      await user.destroy();
      
      // Reset auto-increment after deletion
      await User.sequelize.query(`
        SELECT setval(pg_get_serial_sequence('"Users"', 'id'), (SELECT COALESCE(MAX(id), 0) + 1 FROM "Users"));
      `);
      
      res.json({ message: 'User deleted successfully' });
    } catch (err) {
      console.error('Delete user error:', err);
      res.status(500).json({ message: err.message });
    }
  }
}; 