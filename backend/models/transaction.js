'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Transaction extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Transaction.belongsTo(models.User, {
        foreignKey: 'member_id',
        as: 'member'
      });
      
      Transaction.belongsTo(models.User, {
        foreignKey: 'coach_id',
        as: 'coach'
      });
      
      Transaction.belongsTo(models.Package, {
        foreignKey: 'package_id',
        as: 'package'
      });
    }

    // Method to update transaction status
    static async updateStatus(id, status) {
      return await this.update(
        { transaction_status: status },
        { where: { id } }
      );
    }

    // Method to mark transaction as expired
    static async markAsExpired(id) {
      return await this.update(
        { transaction_status: 'expired' },
        { where: { id } }
      );
    }

    // Method to cancel transaction
    static async cancelTransaction(id) {
      return await this.update(
        { transaction_status: 'canceled' },
        { where: { id } }
      );
    }
  }

  Transaction.init({
    member_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    coach_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    package_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Packages',
        key: 'id'
      }
    },
    transaction_no: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    transaction_status: {
      type: DataTypes.ENUM('active', 'processed', 'expired', 'canceled'),
      allowNull: false,
      defaultValue: 'processed'
    },
    payment_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    transfer_receipt_image: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Transaction',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Add scopes after model initialization
  Transaction.addScope('active', {
    where: { transaction_status: 'active' }
  });

  Transaction.addScope('processed', {
    where: { transaction_status: 'processed' }
  });

  Transaction.addScope('expired', {
    where: { transaction_status: 'expired' }
  });

  Transaction.addScope('canceled', {
    where: { transaction_status: 'canceled' }
  });

  return Transaction;
}; 