import userService from "../services/userService";
import db from '../models/index';
import { response } from "express";

let handleUserRegister = async (req, res) => {
    let message = await userService.handleUserRegister(req.body);
    return res.status(200).json(message);
}

let handleLogin = async (req, res) => {
    let email = req.body.email;
    let password = req.body.password;
    if (!email || !password) {
        return res.status(500).json({
            errCode: 1,
            message: "Missing inputs parameter!"
        })
    }
    else {
        let userData = await userService.handleUserLogin(email, password);
        return res.status(200).json({
            errCode: userData.errCode,
            message: userData.errMessage,
            user: userData.user ? userData.user : {},
            // access_token: userData.access_token ? userData.access_token : {},
            // refresh_token: userData.refresh_token ? userData.refresh_token : {}
        })
    }
}

let handleGetAllUser = async (req, res) => {
    let id = req.query.id;
    if (!id) {
        return res.status(200).json({
            errCode: 0,
            errMessage: 'Missing required parameter',
            users: []
        })
    }
    let users = await userService.getAllUser(id);
    // console.log(users)
    return res.status(200).json({
        errCode: 0,
        errMessage: 'Oke',
        users
    })
}

let handleCreateNewUser = async (req, res) => {
    let message = await userService.createNewUser(req.body)
    // console.log(message)
    return res.status(200).json(message);
}

let handleEditUser = async (req, res) => {
    let data = req.body;
    let message = await userService.updateUser(data);
    return res.status(200).json(message)
}

let handleDeleteUser = async (req, res) => {
    if (!req.body.id) {
        return res.status(200).json({
            errCode: 1,
            errMessage: 'Missing required paramaters!'
        })
    }
    let message = await userService.deleteUser(req.body.id)
    return res.status(200).json(message);
}

let getAllCode = async (req, res) => {
    try {
        // setTimeout(async () => {
        //     let data = await userService.getAllCodeService(req.query.type);
        //     return res.status(200).json(data);
        // }, 3000)
        let data = await userService.getAllCodeService(req.query.type);
        return res.status(200).json(data);
    } catch (e) {
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server'
        })
    }
}

module.exports = {
    handleUserRegister: handleUserRegister,
    handleLogin: handleLogin,
    handleGetAllUser: handleGetAllUser,
    handleCreateNewUser: handleCreateNewUser,
    handleEditUser: handleEditUser,
    handleDeleteUser: handleDeleteUser,
    getAllCode: getAllCode
}