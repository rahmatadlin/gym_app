const { Transaction, User, Package } = require('../models');
const bcrypt = require('bcrypt');

// Generate transaction number
const generateTransactionNo = (packageName, memberName) => {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
  const packagePrefix = packageName.split(' ')[0].toUpperCase();
  const memberPrefix = memberName.split(' ')[0].toUpperCase();
  return `${packagePrefix}/${dateStr}/${memberPrefix}`;
};

// Get all transactions (admin only)
const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      include: [
        {
          model: User,
          as: 'member',
          attributes: ['id', 'name', 'username', 'user_image']
        },
        {
          model: User,
          as: 'coach',
          attributes: ['id', 'name', 'username', 'user_image']
        },
        {
          model: Package,
          as: 'package',
          attributes: ['id', 'package_name', 'price', 'duration']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get transaction by ID
const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findByPk(id, {
      include: [
        {
          model: User,
          as: 'member',
          attributes: ['id', 'name', 'username', 'user_image']
        },
        {
          model: User,
          as: 'coach',
          attributes: ['id', 'name', 'username', 'user_image']
        },
        {
          model: Package,
          as: 'package',
          attributes: ['id', 'package_name', 'price', 'duration']
        }
      ]
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create transaction (admin only)
const createTransaction = async (req, res) => {
  try {
    const {
      member_id,
      coach_id,
      package_id,
      start_date,
      end_date,
      transaction_status,
      payment_date
    } = req.body;

    // Get package and member info for transaction number
    const package = await Package.findByPk(package_id);
    const member = await User.findByPk(member_id);
    
    if (!package || !member) {
      return res.status(404).json({ message: 'Package or member not found' });
    }

    const transaction_no = generateTransactionNo(package.package_name, member.name);

    const transaction = await Transaction.create({
      member_id,
      coach_id,
      package_id,
      transaction_no,
      start_date,
      end_date,
      transaction_status,
      payment_date,
      transfer_receipt_image: req.file ? `/uploads/transactions/${req.file.filename}` : null
    });

    const createdTransaction = await Transaction.findByPk(transaction.id, {
      include: [
        {
          model: User,
          as: 'member',
          attributes: ['id', 'name', 'username', 'user_image']
        },
        {
          model: User,
          as: 'coach',
          attributes: ['id', 'name', 'username', 'user_image']
        },
        {
          model: Package,
          as: 'package',
          attributes: ['id', 'package_name', 'price', 'duration']
        }
      ]
    });

    res.status(201).json(createdTransaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update transaction
const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      member_id,
      coach_id,
      package_id,
      start_date,
      end_date,
      transaction_status,
      payment_date
    } = req.body;

    const transaction = await Transaction.findByPk(id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Update fields
    const updateData = {
      member_id,
      coach_id,
      package_id,
      start_date,
      end_date,
      transaction_status,
      payment_date
    };

    // Add transfer receipt image if provided
    if (req.file) {
      updateData.transfer_receipt_image = `/uploads/transactions/${req.file.filename}`;
    }

    await transaction.update(updateData);

    const updatedTransaction = await Transaction.findByPk(id, {
      include: [
        {
          model: User,
          as: 'member',
          attributes: ['id', 'name', 'username', 'user_image']
        },
        {
          model: User,
          as: 'coach',
          attributes: ['id', 'name', 'username', 'user_image']
        },
        {
          model: Package,
          as: 'package',
          attributes: ['id', 'package_name', 'price', 'duration']
        }
      ]
    });

    res.json(updatedTransaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete transaction
const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findByPk(id);
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    await transaction.destroy();
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get member's own transactions
const getMyTransactions = async (req, res) => {
  try {
    const member_id = req.user.id;
    
    const transactions = await Transaction.findAll({
      where: { member_id },
      include: [
        {
          model: User,
          as: 'coach',
          attributes: ['id', 'name', 'username', 'user_image']
        },
        {
          model: Package,
          as: 'package',
          attributes: ['id', 'package_name', 'price', 'duration', 'package_image']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json(transactions);
  } catch (error) {
    console.error('Error fetching member transactions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create member transaction
const createMemberTransaction = async (req, res) => {
  try {
    const member_id = req.user.id;
    const { package_id, coach_id } = req.body;

    // Get package and member info
    const package = await Package.findByPk(package_id);
    const member = await User.findByPk(member_id);
    
    if (!package) {
      return res.status(404).json({ message: 'Package not found' });
    }

    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // Check if package is active
    if (package.package_status !== 'active') {
      return res.status(400).json({ message: 'Package is not active' });
    }

    // Calculate start and end dates
    const start_date = new Date();
    const end_date = new Date();
    end_date.setDate(end_date.getDate() + package.duration);

    const transaction_no = generateTransactionNo(package.package_name, member.name);

    const transaction = await Transaction.create({
      member_id,
      coach_id: coach_id || null,
      package_id,
      transaction_no,
      start_date,
      end_date,
      transaction_status: 'processed',
      transfer_receipt_image: req.file ? `/uploads/transactions/${req.file.filename}` : null
    });

    const createdTransaction = await Transaction.findByPk(transaction.id, {
      include: [
        {
          model: User,
          as: 'coach',
          attributes: ['id', 'name', 'username', 'user_image']
        },
        {
          model: Package,
          as: 'package',
          attributes: ['id', 'package_name', 'price', 'duration', 'package_image']
        }
      ]
    });

    res.status(201).json(createdTransaction);
  } catch (error) {
    console.error('Error creating member transaction:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getMyTransactions,
  createMemberTransaction
}; 