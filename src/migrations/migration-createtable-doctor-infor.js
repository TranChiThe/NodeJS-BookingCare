'use strict';

const { name } = require("ejs");

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('doctor_infor', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            doctorId: {
                allowNull: false,
                type: Sequelize.INTEGER
            },
            specialtyId: {
                type: Sequelize.STRING
            },
            clinicId: {
                type: Sequelize.INTEGER
            },
            priceId: {
                allowNull: false,
                type: Sequelize.STRING
            },
            provinceId: {
                allowNull: false,
                type: Sequelize.STRING
            },
            paymentId: {
                allowNull: false,
                type: Sequelize.STRING
            },
            homeAddress: {
                allowNull: false,
                type: Sequelize.STRING
            },
            note: {
                allowNull: true,
                type: Sequelize.STRING
            },
            count: {
                defaultValue: 0,
                type: Sequelize.INTEGER
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
        await queryInterface.dropTable('doctor_infor');
    }
};