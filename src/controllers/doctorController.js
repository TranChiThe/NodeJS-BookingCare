import doctorService from '../services/doctorService'
import db from '../models/index'
const cron = require('node-cron');


let getDoctorHome = async (req, res) => {
    let limit = req.query.limit;
    if (!limit) limit = 10;
    try {
        let response = await doctorService.getTopDoctorHome(+limit);
        return res.status(200).json(response);
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            errorCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let getAllDoctor = async (req, res) => {
    try {
        let { specialtyId, clinicId } = req.query
        let doctors = await doctorService.getAllDoctor(specialtyId, clinicId);
        return res.status(200).json(doctors)
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let saveInforDoctor = async (req, res) => {
    try {
        let response = await doctorService.saveDetailInforDoctor(req.body);
        return res.status(200).json(response)
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let updateInforDoctor = async (req, res) => {
    try {
        let response = await doctorService.updateDetailInforDoctor(req.body);
        return res.status(200).json(response)
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let deleteInforDoctor = async (req, res) => {
    try {
        let response = await doctorService.deleteDetailInforDoctor(req.query.doctorId);
        return res.status(200).json(response)
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let getDetailDoctorById = async (req, res) => {
    try {
        let infor = await doctorService.getDetailDoctorById(req.query.id)
        return res.status(200).json(infor);
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let bulkCreateSchedule = async (req, res) => {
    try {
        let infor = await doctorService.bulkCreateSchedule(req.body)
        return res.status(200).json(infor);
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let getScheduleDoctorByDate = async (req, res) => {
    try {
        let infor = await doctorService.getScheduleByDate(req.query.doctorId, req.query.date)
        return res.status(200).json(infor);
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let getExtraInfoDoctorById = async (req, res) => {
    try {
        let infor = await doctorService.getExtraInfoDoctorById(req.query.doctorId)
        return res.status(200).json(infor);
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let getProfileDoctorById = async (req, res) => {
    try {
        let infor = await doctorService.getProfileDoctorById(req.query.doctorId)
        return res.status(200).json(infor);
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let getAllDoctorSchedule = async (req, res) => {
    try {
        let info = await doctorService.getAllDoctorSchedule()
        return res.status(200).json(info);
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let deleteDoctorSchedule = async (req, res) => {
    try {
        let { timeType, status, date } = req.query
        let info = await doctorService.deleteDoctorSchedule(timeType, status, date)
        return res.status(200).json(info);
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let doctorSearch = async (req, res) => {
    try {
        const { searchTerm, specialtyId, clinicId, page = 1, limit = 5 } = req.query;
        const response = await doctorService.doctorSearch(searchTerm, specialtyId, clinicId, parseInt(page), parseInt(limit));
        return res.status(200).json(response);
    } catch (e) {
        console.error('Error in doctorSearch controller:', e);
        return res.status(500).json({
            errorCode: -1,
            errMessage: 'Error from server...'
        });
    }
};

let getTotalDoctor = async (req, res) => {
    try {
        let info = await doctorService.getTotalDoctor(req.query.year, req.query.week)
        return res.status(200).json(info);
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let createBusySchedule = async (req, res) => {
    try {
        let infor = await doctorService.createBusySchedule(req.body)
        return res.status(200).json(infor);
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let getScheduleDoctorForWeek = async (req, res) => {
    try {
        let infor = await doctorService.getScheduleDoctorForWeek(req.query.doctorId, req.query.weekNumber)
        return res.status(200).json(infor);
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let getPatientAppointment = async (req, res) => {
    try {
        let { doctorId, statusId, date, searchTerm, page = 1, limit = 5 } = req.query
        let response = await doctorService.getPatientAppointment(doctorId, statusId, date, searchTerm, parseInt(page), parseInt(limit));
        return res.status(200).json(response)
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let postConfirmAppointment = async (req, res) => {
    try {
        let response = await doctorService.postConfirmAppointment(req.query.id);
        return res.status(200).json(response)
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let postCancelAppointment = async (req, res) => {
    try {
        let response = await doctorService.postCancelAppointment(req.query.id);
        return res.status(200).json(response)
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let getDoctorComment = async (req, res) => {
    try {
        let { doctorId, page = 1, limit = 4 } = req.query
        let response = await doctorService.getDoctorComment(doctorId, parseInt(page), parseInt(limit));
        return res.status(200).json(response)
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let getAllDoctorCommentByDate = async (req, res) => {
    try {
        let { doctorId, startDate, endDate, page = 1, limit = 10 } = req.query
        let response = await doctorService.getAllDoctorCommentByDate(doctorId, startDate, endDate, parseInt(page), parseInt(limit));
        return res.status(200).json(response)
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let deleteDoctorComment = async (req, res) => {
    try {
        let { id } = req.query
        let response = await doctorService.deleteDoctorComment(id);
        return res.status(200).json(response)
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}
module.exports = {
    getDoctorHome,
    getAllDoctor,
    saveInforDoctor,
    getDetailDoctorById,
    bulkCreateSchedule,
    getScheduleDoctorByDate,
    getExtraInfoDoctorById,
    getProfileDoctorById,
    getAllDoctorSchedule,
    deleteDoctorSchedule,
    doctorSearch,
    getTotalDoctor,
    createBusySchedule,
    getScheduleDoctorForWeek,
    updateInforDoctor,
    deleteInforDoctor,
    getPatientAppointment,
    postConfirmAppointment,
    postCancelAppointment,
    getDoctorComment,
    getAllDoctorCommentByDate,
    deleteDoctorComment
}