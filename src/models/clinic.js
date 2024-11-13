'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Clinic extends Model {
        static associate(models) {
            // define association here
            Clinic.hasMany(models.Doctor_Infor, { foreignKey: 'id' })
        }
    };
    Clinic.init({
        name: DataTypes.STRING,
        address: DataTypes.STRING,
        introductionHTML: DataTypes.TEXT,
        introductionMarkdown: DataTypes.TEXT,
        proStrengthHTML: DataTypes.TEXT,
        proStrengthMarkdown: DataTypes.TEXT,
        equipmentHTML: DataTypes.TEXT,
        equipmentMarkdown: DataTypes.TEXT,
        //
        nameEn: DataTypes.STRING,
        addressEn: DataTypes.STRING,
        introductionHTMLEn: DataTypes.TEXT,
        introductionMarkdownEn: DataTypes.TEXT,
        proStrengthHTMLEn: DataTypes.TEXT,
        proStrengthMarkdownEn: DataTypes.TEXT,
        equipmentHTMLEn: DataTypes.TEXT,
        equipmentMarkdownEn: DataTypes.TEXT,
        image: DataTypes.STRING,
    }, {
        sequelize,
        modelName: 'Clinic',
    });
    return Clinic;
};