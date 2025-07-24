'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Package extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Package.hasMany(models.Transaction, {
        foreignKey: 'package_id',
        as: 'transactions'
      });
    }

    // Soft delete method
    static async softDelete(id) {
      return await this.update(
        { package_status: 'inactive' },
        { where: { id } }
      );
    }

    // Restore method
    static async restore(id) {
      return await this.update(
        { package_status: 'active' },
        { where: { id } }
      );
    }
  }

  Package.init({
    package_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    package_image: {
      type: DataTypes.STRING,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    package_status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active'
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 30
    },
    is_coaching_flag: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'Package',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Add scopes after model initialization
  Package.addScope('active', {
    where: { package_status: 'active' }
  });

  Package.addScope('inactive', {
    where: { package_status: 'inactive' }
  });

  return Package;
};