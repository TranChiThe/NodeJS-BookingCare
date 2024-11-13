'use strict';

const { name } = require("ejs");

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('clinics', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            name: {
                type: Sequelize.STRING
            },
            address: {
                type: Sequelize.STRING
            },
            introductionHTML: {
                type: Sequelize.TEXT
            },
            introductionMarkdown: {
                type: Sequelize.TEXT
            },
            proStrengthHTML: {
                type: Sequelize.TEXT
            },
            proStrengthMarkdown: {
                type: Sequelize.TEXT
            },
            equipmentHTML: {
                type: Sequelize.TEXT
            },
            equipmentMarkdown: {
                type: Sequelize.TEXT
            },
            //
            nameEn: {
                type: Sequelize.STRING
            },
            addressEn: {
                type: Sequelize.STRING
            },
            introductionHTMLEn: {
                type: Sequelize.TEXT
            },
            introductionMarkdownEn: {
                type: Sequelize.TEXT
            },
            proStrengthHTMLEn: {
                type: Sequelize.TEXT
            },
            proStrengthMarkdownEn: {
                type: Sequelize.TEXT
            },
            equipmentHTMLEn: {
                type: Sequelize.TEXT
            },
            equipmentMarkdownEn: {
                type: Sequelize.TEXT
            },
            image: {
                type: Sequelize.BLOB('long')
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
        await queryInterface.dropTable('clinics');
    }
};