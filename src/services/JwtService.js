import jwt from 'jsonwebtoken'
import { Model } from 'sequelize';
import db from '../models/index'
import dotenv from 'dotenv';
dotenv.config();

// export const generalAccessToken = (payload) => {
//     console.log('check payload: ', payload);
//     const access_token = jwt.sign({
//         payload
//     }, process.env.ACCESS_TOKEN, { expiresIn: '30s' });
//     return access_token;
// }

// export const generalRefreshToken = (payload) => {
//     const refresh_token = jwt.sign({
//         payload
//     }, process.env.REFRESH_TOKEN, { expiresIn: '365d' });
//     return refresh_token;
// }

// module.exports = {
//     generalAccessToken,
//     generalRefreshToken
// }

// const getGroupWithRole = async (user) => {
//     let role = await db.User.findOne({
//         where: {id: user.id},
//         include: [{model: }]
//     })
// }

// module.exports = {
//     getGroupWithRole,
// }