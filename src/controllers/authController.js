import authService from "../services/authService";
import db from '../models/index';
import { response } from "express";
import cookie from 'cookie-parser'
import jwt from 'jsonwebtoken';

let arrToken = [];

let handleUserRegister = async (req, res) => {
    let message = await authService.handleUserRegister(req.body);
    return res.status(200).json(message);
}



let handleLogin = async (req, res) => {
    let email = req.body.email;
    let password = req.body.password;
    if (!email || !password) {
        return res.status(200).json({
            errCode: 1,
            message: "Missing inputs parameter!"
        });
    } else {
        let userData = await authService.handleUserLogin(email, password);
        if (userData.errCode === 0) {
            res.cookie('refreshToken', userData.refresh_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                path: '/',
                sameSite: 'strict',
            });
            arrToken.push(userData.refresh_token);
            return res.status(200).json({
                errCode: userData.errCode,
                message: userData.errMessage,
                user: userData.user ? userData.user : {},
                access_token: userData.access_token,
            });
        } else {
            return res.status(200).json({
                errCode: userData.errCode,
                message: userData.errMessage
            });
        }
    }
}

let refreshToken = (req, res) => {
    let refreshTokenFromCookie = req.cookies.refreshToken;
    if (!refreshTokenFromCookie) {
        return res.status(401).json(`You're not authenticated`);
    }

    if (!arrToken.includes(refreshTokenFromCookie)) {
        return res.status(401).json(`Refresh token is not valid`);
    }

    jwt.verify(refreshTokenFromCookie, process.env.REFRESH_TOKEN, (err, user) => {
        if (err) {
            return res.status(403).json(`Token is not valid`);
        }

        arrToken = arrToken.filter((token) => token !== refreshTokenFromCookie);
        let newAccessToken = authService.generateAccessToken(user);
        let newRefreshToken = authService.generateRefreshToken(user);

        arrToken.push(newRefreshToken);
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',  // Chỉ sử dụng 'secure' trong môi trường production
            path: '/',
            sameSite: 'strict',
        });

        return res.status(200).json({
            access_token: newAccessToken
        });
    });
}

let logOut = (req, res) => {
    let refreshTokenFromCookie = req.cookies.refreshToken;
    res.clearCookie('refreshToken');
    arrToken = arrToken.filter(token => token !== refreshTokenFromCookie);
    return res.status(200).json('Logged out');
}


module.exports = {
    handleUserRegister: handleUserRegister,
    handleLogin: handleLogin,
    refreshToken: refreshToken,
    logOut: logOut,
}