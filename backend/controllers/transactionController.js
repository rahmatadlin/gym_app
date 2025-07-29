const { Transaction, User, Package } = require('../models');
const bcrypt = require('bcrypt');

// Generate transaction number
const generateTransactionNo = (packageName, username) => {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');
  const formattedPackageName = packageName.replace(/\s+/g, '').toUpperCase();
  const formattedUsername = username.replace(/\s+/g, '').toUpperCase();
  return `${formattedPackageName}/${dateStr}${timeStr}/${formattedUsername}`;
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
          attributes: ['id', 'package_name', 'price', 'duration', 'is_coaching_flag']
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
          attributes: ['id', 'package_name', 'price', 'duration', 'is_coaching_flag']
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

    const transaction_no = generateTransactionNo(package.package_name, member.username);

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
          attributes: ['id', 'package_name', 'price', 'duration', 'is_coaching_flag']
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
          attributes: ['id', 'package_name', 'price', 'duration', 'is_coaching_flag']
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
          attributes: ['id', 'package_name', 'price', 'duration', 'package_image', 'is_coaching_flag']
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

    const transaction_no = generateTransactionNo(package.package_name, member.username);

    const transaction = await Transaction.create({
      member_id,
      coach_id: coach_id || null,
      package_id,
      transaction_no,
      start_date,
      end_date,
      transaction_status: 'waiting_for_payment',
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
          attributes: ['id', 'package_name', 'price', 'duration', 'package_image', 'is_coaching_flag']
        }
      ]
    });

    res.status(201).json(createdTransaction);
  } catch (error) {
    console.error('Error creating member transaction:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update member's own transaction
const updateMemberTransaction = async (req, res) => {
  try {
    const member_id = req.user.id;
    const { id } = req.params;
    const { coach_id, transaction_status } = req.body;

    // Find the transaction and ensure it belongs to the member
    const transaction = await Transaction.findOne({
      where: { 
        id,
        member_id 
      },
      include: [
        {
          model: Package,
          as: 'package',
          attributes: ['id', 'package_name', 'price', 'duration', 'package_image', 'is_coaching_flag']
        }
      ]
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Handle status updates (like cancelling)
    if (transaction_status && !coach_id && !req.file) {
      // Allow cancelling transactions in waiting_for_payment status
      if (transaction_status === 'canceled' && transaction.transaction_status === 'waiting_for_payment') {
        await transaction.update({ transaction_status: 'canceled' });
        
        const updatedTransaction = await Transaction.findByPk(id, {
          include: [
            {
              model: User,
              as: 'coach',
              attributes: ['id', 'name', 'username', 'user_image']
            },
            {
              model: Package,
              as: 'package',
              attributes: ['id', 'package_name', 'price', 'duration', 'package_image', 'is_coaching_flag']
            }
          ]
        });
        
        return res.json(updatedTransaction);
      }
      
      return res.status(400).json({ message: 'Invalid status update' });
    }

    // Original logic for updating coach and receipt
    // Check if transaction is in waiting for payment status
    if (transaction.transaction_status !== 'waiting_for_payment') {
      return res.status(400).json({ message: 'Transaction cannot be updated in current status' });
    }

    // Validate coach selection if package requires coaching
    if (transaction.package.is_coaching_flag && !coach_id) {
      return res.status(400).json({ message: 'Coach selection is required for this package' });
    }

    // Update transaction
    const updateData = {
      coach_id: coach_id || null,
      payment_date: new Date(), // Set payment date when receipt is uploaded
      transaction_status: 'processed' // Change status to processed
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
          as: 'coach',
          attributes: ['id', 'name', 'username', 'user_image']
        },
        {
          model: Package,
          as: 'package',
          attributes: ['id', 'package_name', 'price', 'duration', 'package_image', 'is_coaching_flag']
        }
      ]
    });

    res.json(updatedTransaction);
  } catch (error) {
    console.error('Error updating member transaction:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete member's own transaction
const deleteMemberTransaction = async (req, res) => {
  try {
    const member_id = req.user.id;
    const { id } = req.params;

    // Find the transaction and ensure it belongs to the member
    const transaction = await Transaction.findOne({
      where: { 
        id,
        member_id 
      }
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Only allow deletion if transaction is in waiting for payment status
    if (transaction.transaction_status !== 'waiting_for_payment') {
      return res.status(400).json({ message: 'Transaction cannot be deleted in current status' });
    }

    await transaction.destroy();

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting member transaction:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Cancel member's own transaction
const cancelMemberTransaction = async (req, res) => {
  try {
    console.log('Cancel transaction called');
    const member_id = req.user.id;
    const { id } = req.params;
    
    console.log('Member ID:', member_id);
    console.log('Transaction ID:', id);

    // Find the transaction and ensure it belongs to the member
    const transaction = await Transaction.findOne({
      where: { 
        id,
        member_id 
      }
    });

    console.log('Transaction found:', !!transaction);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Only allow cancelling transactions in waiting_for_payment status
    if (transaction.transaction_status !== 'waiting_for_payment') {
      return res.status(400).json({ message: 'Transaction cannot be cancelled in current status' });
    }

    console.log('Updating transaction status to canceled');
    await transaction.update({ transaction_status: 'canceled' });

    const updatedTransaction = await Transaction.findByPk(id, {
      include: [
        {
          model: User,
          as: 'coach',
          attributes: ['id', 'name', 'username', 'user_image']
        },
        {
          model: Package,
          as: 'package',
          attributes: ['id', 'package_name', 'price', 'duration', 'package_image', 'is_coaching_flag']
        }
      ]
    });

    console.log('Sending response');
    res.json(updatedTransaction);
  } catch (error) {
    console.error('Error cancelling member transaction:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all coaches for member selection
const getCoaches = async (req, res) => {
  try {
    const coaches = await User.findAll({
      where: { 
        role: 'coach',
        user_status: 'active'
      },
      attributes: ['id', 'name', 'username', 'user_image'],
      order: [['name', 'ASC']]
    });

    res.json(coaches);
  } catch (error) {
    console.error('Error fetching coaches:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get transactions assigned to a specific coach
const getCoachTransactions = async (req, res) => {
  try {
    const coach_id = req.user.id;
    
    const transactions = await Transaction.findAll({
      where: { coach_id },
      include: [
        {
          model: User,
          as: 'member',
          attributes: ['id', 'name', 'username', 'user_image']
        },
        {
          model: Package,
          as: 'package',
          attributes: ['id', 'package_name', 'price', 'duration', 'package_image', 'is_coaching_flag']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json(transactions);
  } catch (error) {
    console.error('Error fetching coach transactions:', error);
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
  createMemberTransaction,
  getCoaches,
  getCoachTransactions,
  updateMemberTransaction,
  deleteMemberTransaction,
  cancelMemberTransaction
}; 