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
                type: Sequelize.STRING
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
            contentHTML: {
                allowNull: false,
                type: Sequelize.TEXT('long')
            },
            contentMarkDown: {
                allowNull: false,
                type: Sequelize.TEXT('long')
            },
            description: {
                allowNull: true,
                type: Sequelize.TEXT('long')
            },
            //
            contentHTMLEn: {
                allowNull: false,
                type: Sequelize.TEXT('long')
            },
            contentMarkDownEn: {
                allowNull: false,
                type: Sequelize.TEXT('long')
            },
            descriptionEn: {
                allowNull: true,
                type: Sequelize.TEXT('long')
            },
            homeAddress: {
                allowNull: false,
                type: Sequelize.STRING
            },
            note: {
                allowNull: true,
                type: Sequelize.STRING
            },
            noteEn: {
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