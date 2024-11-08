'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Appointment extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    };
    Appointment.init({
        fullName: DataTypes.STRING,
        phoneNumber: DataTypes.STRING,
        statusId: DataTypes.STRING,
        doctorId: DataTypes.INTEGER,
        patientId: DataTypes.INTEGER,
        recordId: DataTypes.STRING,
        date: DataTypes.STRING,
        scheduleTime: DataTypes.STRING,
        timeType: DataTypes.STRING,
        token: DataTypes.STRING,
    }, {
        sequelize,
        modelName: 'Appointment',
    });
    return Appointment;
};