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
        package_status: 'active',
        duration: 30,
        is_coaching_flag: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        package_name: 'Premium Coaching Package',
        package_image: null,
        description: 'Advanced package with personal coaching sessions, customized workout plans, nutrition guidance, and priority access to premium equipment.',
        price: 1500000.00,
        package_status: 'active',
        duration: 90,
        is_coaching_flag: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        package_name: 'Student Fitness Package',
        package_image: null,
        description: 'Special package for students with valid ID. Includes access to gym facilities, group classes, and student discounts on additional services.',
        price: 300000.00,
        package_status: 'active',
        duration: 60,
        is_coaching_flag: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        package_name: 'Corporate Wellness Package',
        package_image: null,
        description: 'Designed for corporate clients with group discounts, wellness programs, and flexible scheduling options.',
        price: 800000.00,
        package_status: 'active',
        duration: 45,
        is_coaching_flag: false,
        created_at: new Date(),
        updated_at: new Date(),
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Packages', null, {});
  }
};
