'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Appointment extends Model {
        static associate(models) {
            Appointment.belongsTo(models.Patient, { foreignKey: 'patientId', targetKey: 'id', as: 'appointmentData' })
            Appointment.belongsTo(models.Allcode, { foreignKey: 'statusId', targetKey: 'keyMap', as: 'statusData' })
            Appointment.belongsTo(models.Allcode, { foreignKey: 'timeType', targetKey: 'keyMap', as: 'timeTypeAppointment' })
            Appointment.belongsTo(models.User, { foreignKey: 'doctorId', targetKey: 'id', as: 'doctorAppoitmentData' })
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
        appointmentFee: DataTypes.DECIMAL(10, 2),
        reason: DataTypes.STRING,
        token: DataTypes.STRING,
    }, {
        sequelize,
        modelName: 'Appointment',
    });
    return Appointment;
};