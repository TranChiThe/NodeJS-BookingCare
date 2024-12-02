'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Specialty extends Model {
        static associate(models) {
            // define association here
            Specialty.belongsTo(models.Allcode, { foreignKey: 'name', targetKey: 'keyMap', as: 'specialtyData' })
            Specialty.hasMany(models.Doctor_Infor, { foreignKey: 'specialtyId' })
        }
    };
    Specialty.init({
        name: DataTypes.STRING,
        descriptionHTML: DataTypes.TEXT,
        descriptionMarkdown: DataTypes.TEXT,
        descriptionHTMLEn: DataTypes.TEXT,
        descriptionMarkdownEn: DataTypes.TEXT,
        doctorNumber: DataTypes.INTEGER,
        image: DataTypes.STRING,
    }, {
        sequelize,
        modelName: 'Specialty',
    });
    return Specialty;
};