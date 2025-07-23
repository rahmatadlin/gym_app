'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'date_of_birth', {
      type: Sequelize.DATE,
      allowNull: true,
      after: 'name'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'date_of_birth');
  }
};
