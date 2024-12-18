'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Allcode extends Model {
        static associate(models) {
            Allcode.hasMany(models.User, { foreignKey: 'positionId', as: 'positionData' })
            Allcode.hasMany(models.User, { foreignKey: 'gender', as: 'genderData' });
            Allcode.hasMany(models.Schedule, { foreignKey: 'timeType', as: 'timeTypeData' });

            Allcode.hasMany(models.Doctor_Infor, { foreignKey: 'priceId', as: 'priceTypeData' });
            Allcode.hasMany(models.Doctor_Infor, { foreignKey: 'paymentId', as: 'paymentTypeData' });
            Allcode.hasMany(models.Doctor_Infor, { foreignKey: 'provinceId', as: 'provinceTypeData' });

            Allcode.hasMany(models.Specialty, { foreignKey: 'name', as: 'specialtyData' });
            Allcode.hasMany(models.Clinic, { foreignKey: 'name', as: 'clinicData' });
            Allcode.hasMany(models.Doctor_Infor, { foreignKey: 'clinicId', as: 'clinicTypeData' });

            Allcode.hasMany(models.Patient, { foreignKey: 'gender', as: 'genderPatient' });
            Allcode.hasMany(models.Appointment, { foreignKey: 'statusId', as: 'statusData' });
            Allcode.hasMany(models.Appointment, { foreignKey: 'timeType', as: 'timeTypeAppointment' });




        }
    };
    Allcode.init({
        keyMap: DataTypes.STRING,
        type: DataTypes.STRING,
        valueEn: DataTypes.STRING,
        valueVi: DataTypes.STRING,

    }, {
        sequelize,
        modelName: 'Allcode',
    });
    return Allcode;
};