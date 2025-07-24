'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First, update the enum type to include the new status
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Transactions_transaction_status" ADD VALUE 'waiting_for_payment';
    `);
    
    // Then update the default value
    await queryInterface.changeColumn('Transactions', 'transaction_status', {
      type: Sequelize.ENUM('active', 'processed', 'expired', 'canceled', 'waiting_for_payment'),
      allowNull: false,
      defaultValue: 'waiting_for_payment'
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert the default value
    await queryInterface.changeColumn('Transactions', 'transaction_status', {
      type: Sequelize.ENUM('active', 'processed', 'expired', 'canceled', 'waiting_for_payment'),
      allowNull: false,
      defaultValue: 'processed'
    });
    
    // Note: PostgreSQL doesn't support removing enum values easily, so we'll leave the enum as is
  }
};
