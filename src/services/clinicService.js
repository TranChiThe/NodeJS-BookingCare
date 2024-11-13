import { raw } from 'body-parser';
import db from '../models/index';
import dotenv from 'dotenv';
import { name } from 'ejs';
dotenv.config();
import _, { includes, reject } from 'lodash'
import { where } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';


let createdClinic = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (data.language === 'vi') {
                if (!data.name || !data.image || !data.address ||
                    !data.introductionHTML || !data.introductionMarkdown ||
                    !data.proStrengthHTML || !data.proStrengthMarkdown ||
                    !data.equipmentHTML || !data.equipmentMarkdown
                ) {
                    resolve({
                        errCode: 1,
                        errMessage: 'Missing input parameter!'
                    })
                } else {
                    let res = await db.Clinic.findOne({
                        where: { name: data.name },
                        attributes: ['name'],
                        raw: false
                    })
                    if (res === null) {
                        await db.Clinic.create({
                            name: data.name,
                            image: data.image,
                            address: data.address,
                            introductionHTML: data.introductionHTML,
                            proStrengthHTML: data.proStrengthHTML,
                            equipmentHTML: data.equipmentHTML,
                            introductionMarkdown: data.introductionMarkdown,
                            proStrengthMarkdown: data.proStrengthMarkdown,
                            equipmentMarkdown: data.equipmentMarkdown,
                            //
                            nameEn: '',
                            addressEn: '',
                            introductionHTMLEn: '',
                            introductionMarkdownEn: '',
                            proStrengthHTMLEn: '',
                            proStrengthMarkdownEn: '',
                            equipmentHTMLEn: '',
                            equipmentMarkdownEn: '',
                        })
                        resolve({
                            errCode: 0,
                            errMessage: 'Oke'
                        })
                    }
                    else {
                        resolve({
                            errCode: 2,
                            errMessage: 'The clinic already exists in the system.'
                        })
                    }
                }
            } else if (data.language === 'en') {
                if (!data.image || !data.addressEn ||
                    !data.introductionHTMLEn || !data.introductionMarkdownEn ||
                    !data.proStrengthHTMLEn || !data.proStrengthMarkdownEn ||
                    !data.equipmentHTMLEn || !data.equipmentMarkdownEn
                ) {
                    resolve({
                        errCode: 1,
                        errMessage: 'Missing input parameter!'
                    })
                } else {
                    let clinic = await db.Clinic.findOne({
                        where: { name: data.name },
                        raw: false
                    })
                    if (clinic) {
                        clinic.image = data.image;
                        clinic.addressEn = data.addressEn;
                        clinic.introductionHTMLEn = data.introductionHTMLEn;
                        clinic.proStrengthHTMLEn = data.proStrengthHTMLEn;
                        clinic.equipmentHTMLEn = data.equipmentHTMLEn;
                        clinic.introductionMarkdownEn = data.introductionMarkdownEn;
                        clinic.proStrengthMarkdownEn = data.proStrengthMarkdownEn;
                        clinic.equipmentMarkdownEn = data.equipmentMarkdownEn;
                        await clinic.save();
                        resolve({
                            errCode: 0,
                            errMessage: `Update the clinic succeeds!`
                        });
                    }
                    else {
                        resolve({
                            errCode: 3,
                            errMessage: 'You need to enter Vietnamese language information first.'
                        })
                    }
                }
            }

        } catch (e) {
            reject(e);
        }
    })

}

let getAllClinic = () => {
    return new Promise(async (resolve, reject) => {
        try {
            let data = await db.Clinic.findAll({
                include: [
                    { model: db.Allcode, as: 'clinicData', attributes: ['valueVi', 'valueEn'] }
                ],
                raw: true,
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

let getDetailClinicById = (name) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!name) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing parameter'
                })
            }
            else {
                let data = await db.Clinic.findOne({
                    where: {
                        name: name
                    },
                    raw: true,
                    include: [
                        { model: db.Allcode, as: 'clinicData', attributes: ['valueEn', 'valueVi'] },
                    ],
                    raw: true,
                    nest: true,
                })
                if (data) {
                    let doctorClinic = [];
                    doctorClinic = await db.Doctor_Infor.findAll({
                        where: {
                            clinicId: name
                        },
                        attributes: ['doctorId', 'provinceId'],
                        raw: true,
                    })
                    data.doctorClinic = doctorClinic;
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

let updateClinicInformation = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            let clinic = await db.Clinic.findOne({
                where: { name: data.name }
            })
            if (data.language === 'vi') {
                if (!data.name || !data.image || !data.address ||
                    !data.introductionHTML || !data.introductionMarkdown ||
                    !data.proStrengthHTML || !data.proStrengthMarkdown ||
                    !data.equipmentHTML || !data.equipmentMarkdown) {
                    resolve({
                        errCode: 1,
                        errMessage: 'Missing input parameter!'
                    })
                } else {
                    if (clinic) {
                        clinic.name = data.name;
                        clinic.image = data.image;
                        clinic.address = data.address;
                        clinic.introductionHTML = data.introductionHTML;
                        clinic.proStrengthHTML = data.proStrengthHTML;
                        clinic.equipmentHTML = data.equipmentHTML;
                        clinic.introductionMarkdown = data.introductionMarkdown;
                        clinic.proStrengthMarkdown = data.proStrengthMarkdown;
                        clinic.equipmentMarkdown = data.equipmentMarkdown;
                        await clinic.save();
                        resolve({
                            errCode: 0,
                            errMessage: `Update the clinic succeeds!`
                        });
                    } else {
                        resolve({
                            errCode: 2,
                            errMessage: 'Clinic does not exist in the system'
                        })
                    }
                }
            } else if (data.language === 'en') {
                if (!data.image || !data.addressEn ||
                    !data.introductionHTMLEn || !data.introductionMarkdownEn ||
                    !data.proStrengthHTMLEn || !data.proStrengthMarkdownEn ||
                    !data.equipmentHTMLEn || !data.equipmentMarkdownEn) {
                    resolve({
                        errCode: 1,
                        errMessage: 'Missing input parameter!'
                    })
                } else {
                    if (clinic) {
                        clinic.image = data.image;
                        clinic.addressEn = data.addressEn;
                        clinic.introductionHTMLEn = data.introductionHTMLEn;
                        clinic.proStrengthHTMLEn = data.proStrengthHTMLEn;
                        clinic.equipmentHTMLEn = data.equipmentHTMLEn;
                        clinic.introductionMarkdownEn = data.introductionMarkdownEn;
                        clinic.proStrengthMarkdownEn = data.proStrengthMarkdownEn;
                        clinic.equipmentMarkdownEn = data.equipmentMarkdownEn;
                        await clinic.save();
                        resolve({
                            errCode: 0,
                            errMessage: 'Oke'
                        })
                    } else {
                        resolve({
                            errCode: 2,
                            errMessage: 'Clinic does not exist in the system'
                        })
                    }
                }
            }
        } catch (e) {
            reject(e);
        }
    })

}

let clinicDelete = (name) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!name || name === '') {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing input parameter'
                })
            } else {
                let clinic = await db.Clinic.findOne({
                    where: { name: name }
                })
                if (clinic) {
                    await db.Clinic.destroy({
                        where: { name: name }
                    })
                    resolve({
                        errCode: 0,
                        errMessage: "Oke",
                    })
                } else {
                    resolve({
                        errCode: 2,
                        errMessage: "Clinic information not found",
                    })
                }
            }

        } catch (e) {
            reject(e);
        }
    })
}

module.exports = {
    createdClinic: createdClinic,
    getAllClinic: getAllClinic,
    getDetailClinicById: getDetailClinicById,
    updateClinicInformation,
    clinicDelete
}

