const { User } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

module.exports = {
  // Register
  async register(req, res) {
    try {
      const { username, password, name, phone_number, gender, address, role, user_image } = req.body;
      const existing = await User.findOne({ where: { username } });
      if (existing) return res.status(400).json({ message: 'Username already exists' });
      const hash = await bcrypt.hash(password, 10);
      const user = await User.create({ username, password: hash, name, phone_number, gender, address, role, user_image });
      res.status(201).json({ message: 'User registered', user: { id: user.id, username: user.username, role: user.role } });
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
      const users = await User.findAll({ attributes: { exclude: ['password'] } });
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

  // Create user (admin only, no password hash for demo)
  async createUser(req, res) {
    try {
      const { username, password, name, phone_number, gender, address, role, user_image } = req.body;
      const hash = await bcrypt.hash(password, 10);
      const user = await User.create({ username, password: hash, name, phone_number, gender, address, role, user_image });
      res.status(201).json({ message: 'User created', user: { id: user.id, username: user.username, role: user.role } });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // Update user
  async updateUser(req, res) {
    try {
      const { name, phone_number, gender, address, role, user_image } = req.body;
      const user = await User.findByPk(req.params.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      await user.update({ name, phone_number, gender, address, role, user_image });
      res.json({ message: 'User updated', user: { id: user.id, username: user.username, role: user.role } });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // Delete user (soft delete)
  async deleteUser(req, res) {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      await user.destroy();
      res.json({ message: 'User deleted' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
}; 