import specialtyService from '../services/specialtyService'

let createSpecialty = async (req, res) => {
    try {
        let info = await specialtyService.createSpecialty(req.body)
        return res.status(200).json(info);
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let updateSpecialty = async (req, res) => {
    try {
        let info = await specialtyService.updateSpecialty(req.body)
        return res.status(200).json(info);
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let deleteSpecialty = async (req, res) => {
    try {
        let info = await specialtyService.deleteSpecialty(req.query.name)
        return res.status(200).json(info);
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let getAllSpecialty = async (req, res) => {
    try {
        let info = await specialtyService.getAllSpecialty()
        return res.status(200).json(info);
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let getSpecialtyById = async (req, res) => {
    try {
        let info = await specialtyService.getSpecialtyById(req.query.id)
        return res.status(200).json(info);
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let getDetailSpecialtyById = async (req, res) => {
    try {
        let info = await specialtyService.getDetailSpecialtyById(req.query.id, req.query.location)
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
    createSpecialty: createSpecialty,
    getAllSpecialty: getAllSpecialty,
    getSpecialtyById: getSpecialtyById,
    getDetailSpecialtyById: getDetailSpecialtyById,
    updateSpecialty,
    deleteSpecialty
}