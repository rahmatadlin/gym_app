'use strict';

const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const passwordHash = await bcrypt.hash('password123', 10);
    await queryInterface.bulkInsert('Users', [
      {
        username: 'adminuser',
        password: passwordHash,
        name: 'Admin User',
        phone_number: '081234567890',
        gender: 'male',
        address: 'Jl. Admin No. 1',
        role: 'admin',
        user_image: 'admin.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: 'coachuser',
        password: passwordHash,
        name: 'Coach User',
        phone_number: '082345678901',
        gender: 'female',
        address: 'Jl. Coach No. 2',
        role: 'coach',
        user_image: 'coach.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: 'memberuser',
        password: passwordHash,
        name: 'Member User',
        phone_number: '083456789012',
        gender: 'male',
        address: 'Jl. Member No. 3',
        role: 'member',
        user_image: 'member.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
