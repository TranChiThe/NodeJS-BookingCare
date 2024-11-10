'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Patient extends Model {
    static associate(models) {
      // define association here
      Patient.belongsTo(models.Allcode, { foreignKey: 'gender', targetKey: 'keyMap', as: 'genderPatient' })
      Patient.hasMany(models.Appointment, { foreignKey: 'patientId', as: 'appointmentData' })
    }
  };
  Patient.init({
    email: DataTypes.STRING,
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    address: DataTypes.TEXT,
    phoneNumber: DataTypes.STRING,
    birthday: DataTypes.STRING,
    gender: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Patient',
  });
  return Patient;
};