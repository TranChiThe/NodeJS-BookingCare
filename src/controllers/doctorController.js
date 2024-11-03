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
        let doctors = await doctorService.getAllDoctor();
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
        let info = await doctorService.deleteDoctorSchedule(req.query.id)
        return res.status(200).json(info);
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

// let doctorSearch = async (req, res) => {
//     try {
//         let response = await doctorService.doctorSearch(req.query.searchTerm, req.query.specialtyId, req.query.clinicId);
//         return res.status(200).json(response);
//     } catch (e) {
//         console.error('Error in doctorSearch controller:', e);
//         return res.status(500).json({
//             errorCode: -1,
//             errMessage: 'Error from server...'
//         })
//     }
// }

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


const deleteOldSchedules = async () => {
    try {
        // Calculate the timestamp for 24 hours ago
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        // Delete schedules older than 24 hours
        const result = await db.Schedule.destroy({
            where: {
                date: { [Op.lt]: oneDayAgo.getTime().toString() } // Assuming 'date' is stored as a string timestamp
            }
        });

        console.log(`${result} old schedule records deleted successfully.`);
    } catch (error) {
        console.error("Error deleting old schedules:", error);
    }
};

// Schedule the task to run daily at midnight
cron.schedule('0 0 * * *', () => {
    console.log("Running daily cleanup task to delete old schedule records...");
    deleteOldSchedules();
});


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
    createBusySchedule
}