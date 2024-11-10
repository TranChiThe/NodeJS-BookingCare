'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Comment extends Model {
        static associate(models) {
            // define association here
            Comment.hasMany(models.Doctor_Infor, { foreignKey: 'id' })
        }
    };
    Comment.init({
        doctorId: DataTypes.INTEGER,
        patientId: DataTypes.INTEGER,
        text: DataTypes.TEXT,
    }, {
        sequelize,
        modelName: 'Comment',
    });
    return Comment;
};