import { where } from "sequelize";
import db from "../models/index";
import bcrypt from 'bcryptjs';
import { raw } from "body-parser";
const salt = bcrypt.genSaltSync(10);
import { checkUserEmail, hashUserPassword } from './authService'

let getAllUser = (userId, roleId, page = 1, limit = 10) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Validate pagination inputs
            if (page < 1 || limit < 1) {
                return reject({
                    errCode: 1,
                    errMessage: 'Page and limit must be positive integers'
                });
            }

            // Setup pagination
            let offset = (page - 1) * limit;
            let users;
            let whereConditions = {};

            // Apply roleId condition if provided
            if (roleId) {
                whereConditions.roleId = roleId;
            }

            // Fetch all users or a single user based on userId
            if (userId === 'All') {
                // Retrieve all users with pagination
                users = await db.User.findAndCountAll({
                    where: whereConditions,
                    limit: limit,
                    offset: offset,
                    order: [['id', 'DESC']],
                    attributes: { exclude: ['password'] },
                    include: [
                        { model: db.Allcode, as: 'positionData', attributes: ['valueEn', 'valueVi'] },
                        { model: db.Allcode, as: 'genderData', attributes: ['valueEn', 'valueVi'] },
                        {
                            model: db.Doctor_Infor,
                            attributes: { exclude: ['id', 'doctorId'] },
                            include: [
                                { model: db.Allcode, as: 'priceTypeData', attributes: ['valueEn', 'valueVi'] },
                                { model: db.Allcode, as: 'paymentTypeData', attributes: ['valueEn', 'valueVi'] },
                                { model: db.Allcode, as: 'provinceTypeData', attributes: ['valueEn', 'valueVi'] },
                            ]
                        }
                    ],
                    raw: true,
                    nest: true,
                });

                // Respond with paginated users
                resolve({
                    errCode: 0,
                    errMessage: 'Success',
                    data: users.rows,
                    currentPage: page,
                    totalPages: Math.ceil(users.count / limit),
                    totalRecords: users.count,
                });

            } else {
                // Retrieve single user by userId
                users = await db.User.findOne({
                    where: { id: userId },
                    attributes: { exclude: ['password'] },
                    include: [
                        { model: db.Allcode, as: 'positionData', attributes: ['valueEn', 'valueVi'] },
                        { model: db.Allcode, as: 'genderData', attributes: ['valueEn', 'valueVi'] }
                    ],
                    raw: true,
                    nest: true,
                });

                // Check if user exists
                if (!users) {
                    return resolve({
                        errCode: 1,
                        errMessage: 'User not found',
                        data: null,
                    });
                }

                // Respond with single user data
                resolve({
                    errCode: 0,
                    errMessage: 'Success',
                    data: [users],  // Wrap in array for consistency
                    currentPage: page,
                    totalPages: 1,
                    totalRecords: 1,
                });
            }

        } catch (error) {
            reject({
                errCode: -1,
                errMessage: 'An error occurred',
                errorDetails: error.message,
            });
        }
    });
};


let createNewUser = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            let checkEmail = await checkUserEmail(data.email)
            if (checkEmail === true) {
                resolve({
                    errCode: 1,
                    errMessage: `Your email has been used, Please choose another email`
                })
            }
            else {
                let hashPasswordFromBcrypt = await hashUserPassword(data.password);
                await db.User.create({
                    email: data.email,
                    password: hashPasswordFromBcrypt,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    address: data.address,
                    phoneNumber: data.phoneNumber,
                    gender: data.gender,
                    roleId: data.roleId,
                    positionId: data.positionId,
                    image: data.avatar
                })
                resolve({
                    errCode: 0,
                    message: 'Oke'
                })
            }
        } catch (e) {
            reject(e);
        }
    })
}

let deleteUser = (userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            let user = await db.User.findOne({
                where: { id: userId }
            })
            if (!user) {
                resolve({
                    errCode: 2,
                    errMessage: `The user isn't exist`
                })
            } else {
                // await user.destroy();
                await db.User.destroy({
                    where: { id: userId }
                })
                resolve({
                    errCode: 0,
                    errMessage: `The user is deleted`
                })
            }
        } catch (e) {
            reject(e);
        }
    })
}

let updateUser = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.id) {
                resolve({
                    errCode: 2,
                    errMessage: `Missing required parameter!`
                })
            }
            let user = await db.User.findOne({
                where: { id: data.id },
                attributes: {
                    exclude: ['password']
                },
                raw: false
            })
            if (user) {
                user.firstName = data.firstName;
                user.lastName = data.lastName;
                user.address = data.address;
                user.phoneNumber = data.phoneNumber;
                user.gender = data.gender;
                user.positionId = data.positionId;
                user.roleId = data.roleId;
                if (data.avatar) {
                    user.image = data.avatar;
                }
                await user.save();
                resolve({
                    errCode: 0,
                    errMessage: `Update the user succeeds!`
                });
            }
            else {
                resolve({
                    errCode: 1,
                    errMessage: `User's not found!`
                });
            }
        } catch (e) {
            reject(e);
        }
    })
}

let getAllCodeService = (typeInput) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!typeInput) {
                resolve({
                    errCode: 0,
                    data: 'Missing parameter!'
                })
            } else {
                let res = {}
                let allcode = await db.Allcode.findAll({
                    where: { type: typeInput }
                });
                resolve(res);
                res.errCode = 0;
                res.data = allcode;
            }
        } catch (e) {
            reject(e);
        }
    })
}

module.exports = {
    getAllUser: getAllUser,
    createNewUser: createNewUser,
    deleteUser: deleteUser,
    updateUser: updateUser,
    getAllCodeService: getAllCodeService
}