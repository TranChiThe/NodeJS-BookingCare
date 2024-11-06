import userService from "../services/userService";
import db from '../models/index';
import { response } from "express";

let handleGetAllUser = async (req, res) => {
    let id = req.query.id;
    let { roleId, page, limit } = req.query
    if (!id) {
        return res.status(400).json({
            errCode: 0,
            errMessage: 'Missing required parameter',
            data: []
        })
    }
    try {
        let data = await userService.getAllUser(id, roleId, parseInt(page), parseInt(limit));
        return res.status(200).json(data)
    } catch (e) {
        console.error('Error in doctorSearch controller:', e);
        return res.status(500).json({
            errorCode: -1,
            errMessage: 'Error from server...'
        });
    }

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
    handleGetAllUser: handleGetAllUser,
    handleCreateNewUser: handleCreateNewUser,
    handleEditUser: handleEditUser,
    handleDeleteUser: handleDeleteUser,
    getAllCode: getAllCode
}