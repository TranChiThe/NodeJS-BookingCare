'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Revenue extends Model {
        static associate(models) {

        }
    };
    Revenue.init({
        appointmentId: DataTypes.INTEGER,
        status: DataTypes.STRING,
        revenue: DataTypes.DECIMAL(10, 2)
    }, {
        sequelize,
        modelName: 'Revenue',
    });
    return Revenue;
};