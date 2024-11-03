'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class BusySchedule extends Model {
        static associate(models) {

        }
    };
    BusySchedule.init({
        doctorId: DataTypes.INTEGER,
        date: DataTypes.STRING,
        timeType: DataTypes.STRING,
        reason: DataTypes.STRING,
    }, {
        sequelize,
        modelName: 'BusySchedule',
    });
    return BusySchedule;
};