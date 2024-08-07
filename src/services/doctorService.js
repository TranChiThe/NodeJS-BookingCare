import { raw } from 'body-parser';
import db from '../models/index';
import { where } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();
import _, { includes, reject } from 'lodash'
const MAX_NUMBER_SCHEDULE = process.env.MAX_NUMBER_SCHEDULE

let getTopDoctorHome = (limitInput) => {
    return new Promise(async (resolve, reject) => {
        try {
            let users = await db.User.findAll({
                where: { roleId: 'R2' },
                limit: limitInput,
                order: [['createdAt', 'DESC']],
                attributes: {
                    exclude: ['password'],
                },
                include: [
                    { model: db.Allcode, as: 'positionData', attributes: ['valueEn', 'valueVi'] },
                    { model: db.Allcode, as: 'genderData', attributes: ['valueEn', 'valueVi'] },
                    { model: db.Doctor_Infor, attributes: ['specialtyId'] }
                ],
                raw: true,
                nest: true,
            })
            resolve({
                errCode: 0,
                data: users,
            })
        } catch (e) {
            reject(e);
        }
    })
}

let getAllDoctor = () => {
    return new Promise(async (resolve, reject) => {
        try {
            let doctors = await db.User.findAll({
                where: { roleId: 'R2' },
                attributes: {
                    exclude: ['password', 'image'],
                },
            })
            resolve({
                errCode: 0,
                data: doctors
            })
        } catch (e) {
            reject(e);
        }
    })
}

let checkRequiredFields = (inputData) => {
    let arrFields = ['doctorId', 'contentHTML', 'contentMarkDown', 'actions', 'selectedPrice',
        'selectedPayment', 'selectedProvince', 'nameClinic', 'addressClinic', 'specialtyId'
    ]
    let isValid = true;
    let element = '';
    for (let i = 0; i < arrFields.length; i++) {
        if (!inputData[arrFields[i]]) {
            isValid = false;
            element = arrFields[i];
            break;
        }
    }
    return {
        isValid: isValid,
        element: element
    }
}

let saveDetailInforDoctor = (inputData) => {
    return new Promise(async (resolve, reject) => {
        try {
            let checkObj = checkRequiredFields(inputData);
            if (checkObj.isValid === false) {
                resolve({
                    errCode: 1,
                    errMessage: `Missing parameter: ${checkObj.element}`
                })
            }
            else {
                if (inputData.actions === "CREATE") {
                    await db.MarkDown.create({
                        contentHTML: inputData.contentHTML,
                        contentMarkDown: inputData.contentMarkDown,
                        description: inputData.description,
                        doctorId: inputData.doctorId,
                    })
                } else if (inputData.actions === "EDIT") {
                    let doctorMarkDown = await db.MarkDown.findOne({
                        where: { doctorId: inputData.doctorId },
                        raw: false,
                    })
                    if (doctorMarkDown) {
                        doctorMarkDown.contentHTML = inputData.contentHTML;
                        doctorMarkDown.contentMarkDown = inputData.contentMarkDown;
                        doctorMarkDown.description = inputData.description;
                        doctorMarkDown.updateAt = new Date();
                        await doctorMarkDown.save()
                    }
                }
                let doctorInfo = await db.Doctor_Infor.findOne({
                    where: { doctorId: inputData.doctorId },
                    raw: false,
                })
                if (doctorInfo) {
                    // update
                    doctorInfo.doctorId = inputData.doctorId;
                    doctorInfo.priceId = inputData.selectedPrice;
                    doctorInfo.paymentId = inputData.selectedPayment;
                    doctorInfo.provinceId = inputData.selectedProvince;
                    doctorInfo.specialtyId = inputData.selectedSpecialty;
                    doctorInfo.clinicId = inputData.selectedClinic;
                    doctorInfo.nameClinic = inputData.nameClinic;
                    doctorInfo.addressClinic = inputData.addressClinic;
                    doctorInfo.note = inputData.note;
                    await doctorInfo.save();
                } else {
                    // create
                    await db.Doctor_Infor.create({
                        doctorId: inputData.doctorId,
                        priceId: inputData.selectedPrice,
                        paymentId: inputData.selectedPayment,
                        provinceId: inputData.selectedProvince,
                        specialtyId: inputData.selectedSpecialty,
                        clinicId: inputData.selectedClinic,
                        nameClinic: inputData.nameClinic,
                        addressClinic: inputData.addressClinic,
                        note: inputData.note
                    })

                }
                resolve({
                    errCode: 0,
                    errMessage: `Save detail infor doctor succeed!`
                })
            }
        } catch (e) {
            reject(e);
        }
    })
}

let getDetailDoctorById = (inputId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!inputId) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing parameter!'
                })
            } else {
                let data = await db.User.findOne({
                    where: {
                        id: inputId
                    },
                    attributes: {
                        exclude: ['password'],
                    },
                    include: [
                        {
                            model: db.MarkDown,
                            attributes: ['description', 'contentHTML', 'contentMarkDown']
                        },
                        { model: db.Allcode, as: 'positionData', attributes: ['valueEn', 'valueVi'] },
                        {
                            model: db.Doctor_Infor,
                            attributes: {
                                exclude: ['id', 'doctorId']
                            },
                            include: [
                                { model: db.Allcode, as: 'priceTypeData', attributes: ['valueEn', 'valueVi'] },
                                { model: db.Allcode, as: 'paymentTypeData', attributes: ['valueEn', 'valueVi'] },
                                { model: db.Allcode, as: 'provinceTypeData', attributes: ['valueEn', 'valueVi'] },
                                // { model: db.Specialty, as: 'specialtyData', attributes: ['nameVi', 'nameEn'] }

                            ]
                        },

                    ],
                    raw: false,
                    nest: true,
                })
                if (data && data.image) {
                    data.image = new Buffer.from(data.image, 'base64').toString('binary');
                }
                if (!data) data = {};
                resolve({
                    errCode: 0,
                    data: data
                })
            }
        } catch (e) {
            reject(e);
        }
    })
}

let bulkCreateSchedule = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.arrSchedule || !data.doctorId || !data.formatedDate) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing requires parameter!'
                })
            }
            else {
                let schedule = data.arrSchedule;
                if (schedule && schedule.length > 0) {
                    schedule = schedule.map(item => {
                        item.maxNumber = MAX_NUMBER_SCHEDULE;
                        return item;
                    })
                }

                //get all existing data
                let existing = await db.Schedule.findAll({
                    where: { doctorId: data.doctorId, date: data.formatedDate },
                    attributes: ['doctorId', 'date', 'timeType', 'maxNumber'],
                    raw: true
                });

                //convert date
                // if (existing && existing.length > 0) {
                //     existing = existing.map(item => {
                //         item.date = new Date(item.date).getTime();
                //         return item
                //     })
                // }

                //compare different
                let toCreate = _.differenceWith(schedule, existing, (a, b) => {
                    return a.timeType === b.timeType && +a.date === +b.date;
                });

                // create data
                if (toCreate && toCreate.length > 0) {
                    await db.Schedule.bulkCreate(toCreate);
                }
                resolve({
                    errCode: 0,
                    errMessage: 'Oke'
                })
            }

        } catch (e) {
            reject(e);
        }
    })
}

let getScheduleByDate = (doctorId, date) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!doctorId || !date) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing require parameter!'
                })
            } else {
                let dataSchedule = await db.Schedule.findAll({
                    where: {
                        doctorId: doctorId,
                        date: date,
                    },
                    include: [
                        {
                            model: db.Allcode, as: 'timeTypeData', attributes: ['valueEn', 'valueVi']
                        },
                        {
                            model: db.User, as: 'doctorData', attributes: ['firstName', 'lastName']
                        },
                        // { model: db.Schedule, attributes: ['currentNumber', 'maxNumber', 'date', 'timeType'] }
                    ],
                    raw: false,
                    nest: true
                })
                if (!dataSchedule) {
                    dataSchedule: [];
                    resolve({
                        errCode: 2,
                        errMessage: 'Error data...'
                    })
                }
                resolve({
                    errCode: 0,
                    data: dataSchedule,
                })
            }
        } catch (e) {
            reject(e);
        }
    })
}

let getExtraInfoDoctorById = (doctorId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!doctorId) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing require parameter!'
                })
            } else {
                let data = await db.Doctor_Infor.findOne({
                    where: { doctorId: doctorId },
                    attributes: {
                        exclude: ['id', 'doctorId']
                    },
                    include: [
                        { model: db.Allcode, as: 'priceTypeData', attributes: ['valueEn', 'valueVi'] },
                        { model: db.Allcode, as: 'paymentTypeData', attributes: ['valueEn', 'valueVi'] },
                        { model: db.Allcode, as: 'provinceTypeData', attributes: ['valueEn', 'valueVi'] },
                    ],
                    raw: false,
                    nest: true,
                })
                if (!data) data = [];
                resolve({
                    errCode: 0,
                    data: data
                })
            }
        } catch (e) {
            reject(e);
        }
    })
}

let getProfileDoctorById = (inputId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!inputId) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing parameter!'
                })
            } else {
                let data = await db.User.findOne({
                    where: {
                        id: inputId
                    },
                    attributes: {
                        exclude: ['password'],
                    },
                    include: [
                        {
                            model: db.MarkDown,
                            attributes: ['description', 'contentHTML', 'contentMarkDown']
                        },
                        { model: db.Allcode, as: 'positionData', attributes: ['valueEn', 'valueVi'] },
                        {
                            model: db.Doctor_Infor,
                            attributes: {
                                exclude: ['id', 'doctorId']
                            },
                            include: [
                                { model: db.Allcode, as: 'priceTypeData', attributes: ['valueEn', 'valueVi'] },
                                { model: db.Allcode, as: 'paymentTypeData', attributes: ['valueEn', 'valueVi'] },
                                { model: db.Allcode, as: 'provinceTypeData', attributes: ['valueEn', 'valueVi'] },
                            ]
                        },
                    ],
                    raw: false,
                    nest: true,
                })
                if (data && data.image) {
                    data.image = new Buffer.from(data.image, 'base64').toString('binary');
                }
                if (!data) data = {};
                resolve({
                    errCode: 0,
                    data: data
                })
            }
        } catch (e) {
            reject(e);
        }
    })
}

// let getAllDoctorSchedule = () => {
//     return new Promise(async (resolve, reject) => {
//         try {
//             let doctors = await db.User.findAll({
//                 where: { roleId: 'R2' },
//                 attributes: {
//                     exclude: ['password', 'image'],
//                 },
//                 include: [
//                     { model: db.Schedule, attributes: ['currentNumber', 'maxNumber', 'date', 'timeType'] }
//                 ],
//                 raw: false,
//                 nest: true,
//             })
//             resolve({
//                 errCode: 0,
//                 data: doctors
//             })
//         } catch (e) {
//             reject(e);
//         }
//     })
// }

module.exports = {
    getTopDoctorHome: getTopDoctorHome,
    getAllDoctor: getAllDoctor,
    saveDetailInforDoctor: saveDetailInforDoctor,
    getDetailDoctorById: getDetailDoctorById,
    bulkCreateSchedule: bulkCreateSchedule,
    getScheduleByDate: getScheduleByDate,
    getExtraInfoDoctorById: getExtraInfoDoctorById,
    getProfileDoctorById: getProfileDoctorById,
    // getAllDoctorSchedule: getAllDoctorSchedule,
}