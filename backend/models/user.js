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
    }
  }
  User.init({
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    password: DataTypes.STRING,
    name: DataTypes.STRING,
    date_of_birth: DataTypes.DATE,
    phone_number: DataTypes.STRING,
    gender: DataTypes.STRING,
    address: DataTypes.TEXT,
    role: {
      type: DataTypes.ENUM('admin', 'coach', 'member'),
      allowNull: false,
      defaultValue: 'member'
    },
    user_image: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'User',
    paranoid: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  });
  return User;
};