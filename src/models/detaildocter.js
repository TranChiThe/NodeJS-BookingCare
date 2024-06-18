'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Detaildocter extends Model {
        static associate(models) {
            // define association here
        }
    };
    Detaildocter.init({
        docterId: DataTypes.INTEGER,
        clinicId: DataTypes.INTEGER,
        specialtyId: DataTypes.INTEGER,
    }, {
        sequelize,
        modelName: 'Detaildocter',
    });
    return Detaildocter;
};