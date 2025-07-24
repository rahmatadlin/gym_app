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
        date_of_birth: new Date('1990-01-01'),
        phone_number: '081234567890',
        gender: 'male',
        address: 'Jl. Admin No. 1',
        role: 'admin',
        user_status: 'active',
        user_image: 'admin.jpg',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        username: 'coachuser',
        password: passwordHash,
        name: 'Coach User',
        date_of_birth: new Date('1985-05-15'),
        phone_number: '082345678901',
        gender: 'female',
        address: 'Jl. Coach No. 2',
        role: 'coach',
        user_status: 'active',
        user_image: 'coach.jpg',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        username: 'memberuser',
        password: passwordHash,
        name: 'Member User',
        date_of_birth: new Date('1995-12-20'),
        phone_number: '083456789012',
        gender: 'male',
        address: 'Jl. Member No. 3',
        role: 'member',
        user_status: 'active',
        user_image: 'member.jpg',
        created_at: new Date(),
        updated_at: new Date(),
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', null, {});
  }
};
