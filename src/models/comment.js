'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Comment extends Model {
        static associate(models) {
            // define association here
            Comment.belongsTo(models.Patient, { foreignKey: 'patientId', targetKey: 'id', as: 'patientComment' })
            Comment.belongsTo(models.User, { foreignKey: 'doctorId', targetKey: 'id', as: 'doctorComment' })

        }
    };
    Comment.init({
        doctorId: DataTypes.INTEGER,
        patientId: DataTypes.INTEGER,
        content: DataTypes.TEXT,
        date: DataTypes.STRING,
        examinationDate: DataTypes.STRING
    }, {
        sequelize,
        modelName: 'Comment',
    });
    return Comment;
};