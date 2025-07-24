'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Drop the member_packages table if it exists
    await queryInterface.dropTable('member_packages', { force: true });
  },
  async down(queryInterface, Sequelize) {
    // This migration is irreversible - we're dropping the table
    // If you need to recreate it, you'll need to create a new migration
  }
}; 