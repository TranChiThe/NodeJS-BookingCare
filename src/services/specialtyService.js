import db from '../models/index';
import dotenv from 'dotenv';
import { name } from 'ejs';
dotenv.config();
import _, { defaults, first, flatMap, includes, reject } from 'lodash'

let createSpecialty = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (data.language === 'vi') {
                if (!data.name || !data.image ||
                    (data.language === 'vi' && (!data.descriptionHTML || !data.descriptionMarkdown))) {
                    resolve({
                        errCode: 1,
                        errMessage: 'Missing input parameter!'
                    })
                }
                else {
                    let specialtyInfo = await db.Specialty.findOne({
                        where: { name: data.name },
                        attributes: ['id', 'name'],
                        raw: false
                    })
                    if (specialtyInfo) {
                        resolve({
                            errCode: 2,
                            errMessage: 'Specialty already exists in the system'
                        })
                    } else {
                        const specialtyData = {
                            name: data.name,
                            image: data.image,
                            doctorNumber: data.doctorNumber || 0
                        };
                        if (data.language === 'vi') {
                            specialtyData.descriptionHTML = data.descriptionHTML;
                            specialtyData.descriptionMarkdown = data.descriptionMarkdown;
                            specialtyData.descriptionHTMLEn = '';
                            specialtyData.descriptionMarkdownEn = '';
                        } else if (data.language === 'en') {
                            specialtyData.descriptionHTMLEn = '';
                            specialtyData.descriptionMarkdownEn = '';
                        }
                        await db.Specialty.create(specialtyData);
                        resolve({
                            errCode: 0,
                            errMessage: 'Oke'
                        })
                    }
                }
            } else if (data.language === 'en') {
                if (!data.name || !data.image ||
                    (data.language === 'en' && (!data.descriptionHTMLEn || !data.descriptionMarkdownEn))) {
                    resolve({
                        errCode: 1,
                        errMessage: 'Missing input parameter!'
                    })
                }
                else {
                    let specialtyInfo = await db.Specialty.findOne({
                        where: { name: data.name },
                        attributes: ['id', 'name'],
                        raw: false
                    })
                    if (specialtyInfo) {
                        specialtyInfo.image = data.image;
                        specialtyInfo.descriptionHTMLEn = data.descriptionHTMLEn;
                        specialtyInfo.descriptionMarkdownEn = data.descriptionMarkdownEn;
                        await specialtyInfo.save();
                        resolve({
                            errCode: 0,
                            errMessage: 'Oke'
                        })
                    } else {
                        resolve({
                            errCode: 3,
                            errMessage: 'Specialty does not exist in the system'
                        })
                    }
                }
            }

        } catch (e) {
            reject(e);
        }
    })
}

let updateSpecialty = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            let specialtyInfo = await db.Specialty.findOne({
                where: { name: data.name },
                attributes: ['id', 'name'],
                raw: false
            })
            if (data.language === 'vi') {
                if (!data.name || !data.image || !data.descriptionHTML || !data.descriptionMarkdown) {
                    resolve({
                        errCode: 1,
                        errMessage: 'Missing input parameter!'
                    })
                } else {
                    if (specialtyInfo) {
                        specialtyInfo.image = data.image;
                        specialtyInfo.descriptionHTML = data.descriptionHTML;
                        specialtyInfo.descriptionMarkdown = data.descriptionMarkdown;
                        await specialtyInfo.save();
                        resolve({
                            errCode: 0,
                            errMessage: 'Oke'
                        })
                    } else {
                        resolve({
                            errCode: 2,
                            errMessage: 'Specialty does not exist in the system'
                        })
                    }
                }
            } else if (data.language === 'en') {
                if (!data.name || !data.image || !data.descriptionHTMLEn || !data.descriptionMarkdownEn) {
                    resolve({
                        errCode: 1,
                        errMessage: 'Missing input parameter!'
                    })
                } else {
                    if (specialtyInfo) {
                        specialtyInfo.image = data.image;
                        specialtyInfo.descriptionHTMLEn = data.descriptionHTMLEn;
                        specialtyInfo.descriptionMarkdownEn = data.descriptionMarkdownEn;
                        await specialtyInfo.save();
                        resolve({
                            errCode: 0,
                            errMessage: 'Oke'
                        })
                    } else {
                        resolve({
                            errCode: 2,
                            errMessage: 'Specialty does not exist in the system'
                        })
                    }
                }
            }
        } catch (e) {
            reject(e);
        }
    })
}

let deleteSpecialty = (name) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!name) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing input parameter!'
                })
            }
            else {
                let specialtyInfo = await db.Specialty.findOne({
                    where: { name: name },
                    raw: false
                })
                if (specialtyInfo) {
                    await db.Specialty.destroy({
                        where: { name: name },
                    })
                    resolve({
                        errCode: 0,
                        errMessage: 'Oke'
                    })
                } else {
                    resolve({
                        errCode: 2,
                        errMessage: 'Specialty does not exist in the system'
                    })
                }
            }
        } catch (e) {
            reject(e);
        }
    })
}

let getAllSpecialty = () => {
    return new Promise(async (resolve, reject) => {
        try {
            let data = await db.Specialty.findAll({
                include: [
                    { model: db.Allcode, as: 'specialtyData', attributes: ['valueVi', 'valueEn'] }
                ],
                raw: false,
                nest: true,
            })
            if (data && data.length > 0) {
                data.map(item => {
                    item.image = new Buffer.from(item.image, 'base64').toString('binary');
                    return item;
                })
            }
            resolve({
                errCode: 0,
                errMessage: "Oke",
                data
            })
        } catch (e) {
            reject(e);
        }
    })
}

let getSpecialtyById = (inputID) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!inputID) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing parameter'
                })
            } else {
                let data = await db.Specialty.findOne({
                    where: {
                        name: inputID
                    },
                })
                resolve({
                    errCode: 0,
                    errMessage: 'Oke',
                    data
                })
            }

        } catch (e) {
            reject(e);
        }
    })
}


let getDetailSpecialtyById = (inputId, location) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!inputId || !location) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing parameter'
                })
            }
            else {
                let data = await db.Specialty.findOne({
                    where: {
                        name: inputId
                    },
                    attributes: ['name', 'descriptionHTML', 'descriptionMarkdown', 'image'],
                    include: [
                        { model: db.Allcode, as: 'specialtyData', attributes: ['valueVi', 'valueEn'] }
                    ],
                    raw: true,
                    nest: true,
                })
                if (data) {
                    let doctorSpecialty = [];
                    if (location === 'ALL') {
                        // find all doctor
                        doctorSpecialty = await db.Doctor_Infor.findAll({
                            where: {
                                specialtyId: inputId
                            },
                            attributes: ['doctorId', 'provinceId'],
                            raw: true
                        })
                    }
                    else {
                        // find doctor by province
                        doctorSpecialty = await db.Doctor_Infor.findAll({
                            where: {
                                specialtyId: inputId,
                                provinceId: location
                            },
                            attributes: ['doctorId', 'provinceId'],
                        })
                    }
                    data.doctorSpecialty = doctorSpecialty;
                }
                else data = {}
                resolve({
                    errCode: 0,
                    errMessage: 'Oke',
                    data,
                })
            }
        } catch (e) {
            reject(e);
        }
    })
}
module.exports = {
    createSpecialty,
    getAllSpecialty,
    getSpecialtyById,
    getDetailSpecialtyById,
    updateSpecialty,
    deleteSpecialty
}