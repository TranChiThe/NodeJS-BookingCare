'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class MarkDown extends Model {
        static associate(models) {
            // define association here
        }
    };
    MarkDown.init({
        contentHTML: DataTypes.TEXT('long'),
        contentMarkDown: DataTypes.TEXT('long'),
        description: DataTypes.TEXT('long'),
        doctorId: DataTypes.INTEGER,
        specialtyId: DataTypes.INTEGER,
        clinicId: DataTypes.INTEGER,
    }, {
        sequelize,
        modelName: 'MarkDown',
    });
    return MarkDown;
};