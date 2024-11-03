'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      email: {
        type: Sequelize.STRING(50)
      },
      password: {
        type: Sequelize.STRING()
      },
      firstName: {
        type: Sequelize.STRING(30)
      },
      lastName: {
        type: Sequelize.STRING(50)
      },
      address: {
        type: Sequelize.TEXT
      },
      phoneNumber: {
        type: Sequelize.STRING(15)
      },
      gender: {
        type: Sequelize.STRING(4),
      },
      image: {
        type: Sequelize.TEXT
      },
      roleId: {
        type: Sequelize.STRING(4),
        defaultValue: 'R3'
      },
      positionId: {
        type: Sequelize.STRING(4)
      },
      isEmailVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Users');
  }
};