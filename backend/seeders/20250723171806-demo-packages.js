'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Packages', [
      {
        package_name: 'Basic Fitness Package',
        package_image: null,
        description: 'Perfect for beginners who want to start their fitness journey. Includes access to gym facilities, basic equipment, and locker room.',
        price: 500000.00,
        role: 'active',
        is_coaching_flag: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        package_name: 'Premium Coaching Package',
        package_image: null,
        description: 'Advanced package with personal coaching sessions, customized workout plans, nutrition guidance, and priority access to premium equipment.',
        price: 1500000.00,
        role: 'active',
        is_coaching_flag: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        package_name: 'Student Fitness Package',
        package_image: null,
        description: 'Special package for students with valid ID. Includes access to gym facilities, group classes, and student discounts on additional services.',
        price: 300000.00,
        role: 'active',
        is_coaching_flag: false,
        created_at: new Date(),
        updated_at: new Date(),
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
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
