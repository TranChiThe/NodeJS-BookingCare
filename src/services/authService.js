import { where } from "sequelize";
import db from "../models/index";
import bcrypt from 'bcryptjs';
import { raw } from "body-parser";
import jwt from 'jsonwebtoken'
const salt = bcrypt.genSaltSync(10);

let checkUserEmail = (userEmail) => {
    return new Promise(async (resolve, reject) => {
        try {
            let user = await db.User.findOne({
                where: { email: userEmail }
            })
            if (user) {
                resolve(true)
            } else {
                resolve(false)
            }
        } catch (e) {
            return reject(e);
        }
    })
}

let hashUserPassword = (password) => {
    return new Promise((resolve, reject) => {
        try {
            let hashPassword = bcrypt.hashSync(password, salt);
            resolve(hashPassword);
        } catch (e) {
            reject(e);
        }
    })
}

let isEmailValid = (email) => {
    return new Promise((resolve, reject) => {
        try {
            let regEmail = /^[a-zA-Z0-9]+@(?:[a-zA-Z0-9]+\.)+[A-Za-z]+$/;
            let checkEmailValid = regEmail.test(email);
            if (checkEmailValid === true) {
                resolve(true);
            } else {
                resolve(false);
            }
        } catch (e) {
            reject(e);
        }
    })
}

let isPasswordValid = (password) => {
    return new Promise((resolve, reject) => {
        try {
            let passw = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,20}$/;
            let checkPwd = passw.test(password)
            if (checkPwd === true) {
                resolve(true);
            }
            else {
                resolve(false);
            }
        } catch (e) {
            reject(e);
        }
    })
}

let handleUserRegister = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            let checkEmailValid = await isEmailValid(data.email);
            let isExists = await checkUserEmail(data.email);
            let checkPasswordValid = await isPasswordValid(data.password);

            if (data.email === '' || checkEmailValid === false) {
                resolve({
                    errCode: 2,
                    errMessage: `Invalid email, please check again`
                })
            }
            else if (isExists === true) {
                resolve({
                    errCode: 1,
                    errMessage: `Your email has been used, Please choose another email`
                })
            }
            else if (data.password === '' || checkPasswordValid === false) {
                resolve({
                    errCode: 3,
                    errMessage: `Password must contain uppercase letters, lowercase letters and numbers`
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
                    image: data.image,
                    roleId: data.role,
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

let generateAccessToken = (user) => {
    let access_token = jwt.sign(
        {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            roleId: user.roleId
        }, process.env.SECRET_CODE,
        { expiresIn: '600s' }
    );
    return access_token
}

let generateRefreshToken = (user) => {
    let refresh_token = jwt.sign(
        {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            roleId: user.roleId
        }, process.env.REFRESH_TOKEN,
        { expiresIn: '365d' }
    );
    return refresh_token
}

let handleUserLogin = (email, password) => {
    return new Promise(async (resolve, reject) => {
        try {
            let userData = {};
            let isExist = await checkUserEmail(email);
            if (isExist) {
                let user = await db.User.findOne({
                    attributes: ['id', 'email', 'password', 'firstName', 'lastName', 'roleId'],
                    where: { email: email },
                    raw: true
                });
                if (user) {
                    //compare password
                    let check = await bcrypt.compare(password, user.password);
                    if (check) {
                        userData.errCode = 0;
                        userData.errMessage = `Oke`

                        // Delete object password
                        delete user.password;

                        // generate token
                        let access_token = generateAccessToken(user)
                        let refresh_token = generateRefreshToken(user);

                        userData.user = user;
                        userData.access_token = access_token
                        userData.refresh_token = refresh_token
                    } else {
                        userData.errCode = 3;
                        userData.errMessage = `Wrong password`
                    }
                } else {
                    userData.errCode = 2;
                    userData.errMessage = `User's not found`;
                }
            } else {
                userData.errCode = 1;
                userData.errMessage = `Your's Email isn't exist in your system. Plz try other email!`;
            }
            resolve(userData)
        } catch (e) {
            reject(e);
        }
    })
}

module.exports = {
    checkUserEmail: checkUserEmail,
    hashUserPassword: hashUserPassword,
    handleUserRegister: handleUserRegister,
    handleUserLogin: handleUserLogin,
    generateAccessToken: generateAccessToken,
    generateRefreshToken: generateRefreshToken
}