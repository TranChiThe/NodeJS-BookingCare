'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Patient extends Model {
    static associate(models) {
      // define association here
      // Patient.belongsTo(models.Allcode, { foreignKey: 'positionId', targetKey: 'keyMap', as: 'positionData' })
      // Patient.belongsTo(models.Allcode, { foreignKey: 'gender', targetKey: 'keyMap', as: 'genderData' })
      // Patient.hasOne(models.MarkDown, { foreignKey: 'doctorId' })
      // Patient.hasOne(models.Doctor_Infor, { foreignKey: 'doctorId' })
    }
  };
  Patient.init({
    roleId: DataTypes.STRING,
    email: DataTypes.STRING,
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    address: DataTypes.TEXT,
    phoneNumber: DataTypes.STRING,
    reason: DataTypes.STRING,
    birthday: DataTypes.STRING,
    gender: DataTypes.STRING,

  }, {
    sequelize,
    modelName: 'Patient',
  });
  return Patient;
};