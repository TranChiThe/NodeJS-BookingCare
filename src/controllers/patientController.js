import patientService from '../services/patientService'

let postBookAppointment = async (req, res) => {
    try {
        let info = await patientService.postBookAppointment(req.body)
        return res.status(200).json(info);
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let postVerifyBookAppointment = async (req, res) => {
    try {
        let info = await patientService.postVerifyBookAppointment(req.body)
        return res.status(200).json(info);
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let HomeSearch = async (req, res) => {
    try {
        let info = await patientService.HomeSearch(req.query.type, req.query.searchTerm)
        return res.status(200).json(info);
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let getAllPatientAppointment = async (req, res) => {
    try {
        let { email, recordId } = req.query
        let info = await patientService.getAllPatientAppointment(email, recordId)
        return res.status(200).json(info);
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

module.exports = {
    postBookAppointment,
    postVerifyBookAppointment,
    HomeSearch,
    getAllPatientAppointment
}