import adminService from '../services/adminService'

let getAppointmentByTime = async (req, res) => {
    try {
        let { type, month, year } = req.query
        let data = await adminService.getAppointmentByTime(type, month, year);
        return res.status(200).json(data)
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let getCountPatientByTime = async (req, res) => {
    try {
        let { type, month, year } = req.query
        let data = await adminService.getCountPatientByTime(type, month, year);
        return res.status(200).json(data)
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

module.exports = {
    getAppointmentByTime,
    getCountPatientByTime
}