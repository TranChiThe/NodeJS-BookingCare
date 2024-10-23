import clinicService from '../services/clinicService'

let createdClinic = async (req, res) => {
    try {
        let info = await clinicService.createdClinic(req.body)
        return res.status(200).json(info);
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let getAllClinic = async (req, res) => {
    try {
        let info = await clinicService.getAllClinic()
        return res.status(200).json(info);
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let getDetailClinicById = async (req, res) => {
    try {
        let info = await clinicService.getDetailClinicById(req.query.id)
        return res.status(200).json(info);
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

module.exports = {
    createdClinic: createdClinic,
    getAllClinic: getAllClinic,
    getDetailClinicById: getDetailClinicById

}