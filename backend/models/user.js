'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.hasMany(models.Transaction, {
        foreignKey: 'member_id',
        as: 'memberTransactions'
      });
      
      User.hasMany(models.Transaction, {
        foreignKey: 'coach_id',
        as: 'coachTransactions'
      });
    }

    // Soft delete method
    static async softDelete(id) {
      return await this.update(
        { user_status: 'inactive' },
        { where: { id } }
      );
    }

    // Restore method
    static async restore(id) {
      return await this.update(
        { user_status: 'active' },
        { where: { id } }
      );
    }
  }

  User.init({
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    date_of_birth: DataTypes.DATE,
    phone_number: DataTypes.STRING,
    gender: DataTypes.STRING,
    address: DataTypes.TEXT,
    role: {
      type: DataTypes.ENUM('admin', 'coach', 'member'),
      allowNull: false,
      defaultValue: 'member'
    },
    user_status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active'
    },
    user_image: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'User',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Add scopes after model initialization
  User.addScope('active', {
    where: { user_status: 'active' }
  });

  User.addScope('inactive', {
    where: { user_status: 'inactive' }
  });

  return User;
};