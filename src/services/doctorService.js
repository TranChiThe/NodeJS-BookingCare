import { raw } from 'body-parser';
import db from '../models/index';
import { where, Op, sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();
import _, { includes, reject } from 'lodash'
import user from '../models/user';
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
        'selectedPayment', 'selectedProvince', 'selectedClinic', 'specialtyId'
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
                        note: inputData.note
                    })

                }
                resolve({
                    errCode: 0,
                    errMessage: `Save detail info doctor succeed!`
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
                    errMessage: 'Missing required parameters!'
                });
            } else {
                let schedule = data.arrSchedule.map(item => ({
                    ...item,
                    maxNumber: MAX_NUMBER_SCHEDULE
                }));

                let busySchedules = await db.BusySchedule.findAll({
                    where: { doctorId: data.doctorId, date: data.formatedDate },
                    attributes: ['timeType'],
                    raw: true
                });
                const busyTimeTypes = busySchedules.map(item => item.timeType);

                schedule = schedule.filter(item => !busyTimeTypes.includes(item.timeType));

                let existing = await db.Schedule.findAll({
                    where: { doctorId: data.doctorId, date: data.formatedDate },
                    attributes: ['timeType', 'date'],
                    raw: true
                });

                let toCreate = _.differenceWith(schedule, existing, (a, b) => {
                    return a.timeType === b.timeType && +a.date === +b.date;
                });

                if (toCreate.length > 0) {
                    await db.Schedule.bulkCreate(toCreate);
                }

                resolve({
                    errCode: 0,
                    errMessage: 'Schedule created successfully, ignoring busy times.'
                });
            }
        } catch (e) {
            reject(e);
        }
    });
};

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
                let positionData = db.User.findAll({
                    where: { id: doctorId },
                    raw: true
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
                    positionData: positionData
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
                        { model: db.Clinic, attributes: ['name', 'address'] },

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

let deleteDoctorSchedule = (inputId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!inputId) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing parameter!'
                })
            } else {
                let appointment = await db.Schedule.findOne({
                    where: { id: inputId }
                })
                if (!appointment) {
                    resolve({
                        errCode: 1,
                        errMessage: 'Appointment does not exist'
                    })
                } else {
                    let data = await db.Schedule.destroy({
                        where: { id: inputId }
                    })
                    resolve({
                        errCode: 0,
                        errMessage: 'Appointment has been deleted'
                    })
                }
            }
        } catch (e) {
            reject(e);
        }
    })
}

// let doctorSearch = (searchTerm, specialtyId, clinicId) => {
//     return new Promise(async (resolve, reject) => {
//         try {
//             let searchConditions = {};
//             let users = [];
//             if (searchTerm) {
//                 let trimmedSearchTerm = searchTerm.trim();
//                 let searchWords = trimmedSearchTerm.split(/\s+/);
//                 searchConditions[Op.or] = [
//                     { firstName: { [Op.like]: `%${searchTerm}%` } },
//                     { lastName: { [Op.like]: `%${searchTerm}%` } },
//                     db.sequelize.where(
//                         db.sequelize.fn('CONCAT', db.sequelize.col('lastName'), ' ', db.sequelize.col('firstName')),
//                         { [Op.like]: `%${searchTerm}%` }
//                     ),
//                     db.sequelize.where(
//                         db.sequelize.fn('CONCAT', db.sequelize.col('firstName'), ' ', db.sequelize.col('lastName')),
//                         { [Op.like]: `%${searchTerm}%` }
//                     )
//                 ];

//             }
//             let searchConditionDoctor = {};
//             if (specialtyId) {
//                 searchConditionDoctor.specialtyId = specialtyId;
//             }
//             if (clinicId) {
//                 searchConditionDoctor.clinicId = clinicId;
//             }
//             users = await db.User.findAll({
//                 where: {
//                     roleId: 'R2',
//                     ...searchConditions
//                 },
//                 limit: 5,
//                 order: [['createdAt', 'DESC']],
//                 attributes: {
//                     exclude: ['password'],
//                 },
//                 include: [
//                     { model: db.Allcode, as: 'positionData', attributes: ['valueEn', 'valueVi'] },
//                     { model: db.Allcode, as: 'genderData', attributes: ['valueEn', 'valueVi'] },
//                     {
//                         model: db.Doctor_Infor,
//                         where: searchConditionDoctor,
//                         attributes: ['specialtyId', 'clinicId']
//                     }
//                 ],
//                 raw: true,
//                 nest: true,
//             })
//             resolve({
//                 errCode: 0,
//                 errMessage: 'Oke',
//                 data: users,
//             })
//         } catch (e) {
//             reject(e);
//         }
//     })
// }

// let doctorSearch = (searchTerm, specialtyId, clinicId, page = 1, limit = 5) => {
//     return new Promise(async (resolve, reject) => {
//         try {
//             let offset = (page - 1) * limit;
//             let searchConditions = {};
//             let searchConditionDoctor = {};
//             let users = [];
//             if (searchTerm) {
//                 searchConditions[Op.or] = [
//                     { firstName: { [Op.like]: `%${searchTerm}%` } },
//                     { lastName: { [Op.like]: `%${searchTerm}%` } },
//                     db.sequelize.where(
//                         db.sequelize.fn('CONCAT', db.sequelize.col('lastName'), ' ', db.sequelize.col('firstName')),
//                         { [Op.like]: `%${searchTerm}%` }
//                     ),
//                     db.sequelize.where(
//                         db.sequelize.fn('CONCAT', db.sequelize.col('firstName'), ' ', db.sequelize.col('lastName')),
//                         { [Op.like]: `%${searchTerm}%` }
//                     )
//                 ];
//             }
//             if (specialtyId) {
//                 searchConditionDoctor.specialtyId = specialtyId;
//             }
//             if (clinicId) {
//                 searchConditionDoctor.clinicId = clinicId;
//             }
//             users = await db.User.findAndCountAll({
//                 where: {
//                     roleId: 'R2',
//                     ...searchConditions
//                 },
//                 limit: limit,
//                 offset: offset,
//                 order: [['createdAt', 'DESC']],
//                 attributes: {
//                     exclude: ['password'],
//                 },
//                 include: [
//                     { model: db.Allcode, as: 'positionData', attributes: ['valueEn', 'valueVi'] },
//                     { model: db.Allcode, as: 'genderData', attributes: ['valueEn', 'valueVi'] },
//                     {
//                         model: db.Doctor_Infor,
//                         where: searchConditionDoctor,
//                         attributes: ['specialtyId', 'clinicId']
//                     }
//                 ],
//                 raw: true,
//                 nest: true,
//             })
//             resolve({
//                 errCode: 0,
//                 errMessage: 'Oke',
//                 data: users.rows,
//                 currentPage: page,
//                 totalPages: Math.ceil(users.count / limit),
//                 totalRecords: users.count,
//             })
//         } catch (e) {
//             reject(e);
//         }
//     })
// }

let doctorSearch = (searchTerm, specialtyId, clinicId, page = 1, limit = 5) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (page < 1 || limit < 1) {
                return reject({ errCode: 1, errMessage: 'Page and limit must be positive integers' });
            }

            let offset = (page - 1) * limit;
            let searchConditions = {};
            let searchConditionDoctor = {};
            if (searchTerm) {
                searchConditions[Op.or] = [
                    { firstName: { [Op.like]: `%${searchTerm}%` } },
                    { lastName: { [Op.like]: `%${searchTerm}%` } },
                    db.sequelize.where(
                        db.sequelize.fn('CONCAT', db.sequelize.col('lastName'), ' ', db.sequelize.col('firstName')),
                        { [Op.like]: `%${searchTerm}%` }
                    ),
                    db.sequelize.where(
                        db.sequelize.fn('CONCAT', db.sequelize.col('firstName'), ' ', db.sequelize.col('lastName')),
                        { [Op.like]: `%${searchTerm}%` }
                    )
                ];
            }
            if (specialtyId) {
                searchConditionDoctor.specialtyId = specialtyId;
            }
            if (clinicId) {
                searchConditionDoctor.clinicId = clinicId;
            }
            let users = await db.User.findAndCountAll({
                where: {
                    roleId: 'R2',
                    ...searchConditions
                },
                limit: limit,
                offset: offset,
                order: [['createdAt', 'DESC']],
                attributes: {
                    exclude: ['password'],
                },
                include: [
                    { model: db.Allcode, as: 'positionData', attributes: ['valueEn', 'valueVi'] },
                    { model: db.Allcode, as: 'genderData', attributes: ['valueEn', 'valueVi'] },
                    {
                        model: db.Doctor_Infor,
                        where: searchConditionDoctor,
                        attributes: ['specialtyId', 'clinicId']
                    }
                ],
                raw: true,
                nest: true,
            });

            resolve({
                errCode: 0,
                errMessage: 'Success',
                data: users.rows,
                currentPage: page,
                totalPages: Math.ceil(users.count / limit),
                totalRecords: users.count,
            });
        } catch (e) {
            reject({ errCode: 2, errMessage: e.message || 'An error occurred during the search' });
        }
    });
};


let getTotalDoctor = (year, week) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Tính toán ngày bắt đầu và kết thúc của tuần
            const startDate = new Date(year, 0, 1 + (week - 1) * 7);
            const endDate = new Date(year, 0, 1 + week * 7);

            // Đảm bảo rằng endDate không vượt quá cuối năm
            if (week === 53) {
                endDate.setFullYear(year + 1, 0, 1);
            }

            const totalAccounts = await db.User.count({
                where: {
                    createdAt: {
                        [Op.gte]: startDate,
                        [Op.lt]: endDate
                    }
                }
            });
            resolve({
                errCode: 0,
                errMessage: 'Oke',
                data: totalAccounts
            })
        } catch (error) {
            reject(error)
        }
    })
}

let createBusySchedule = (data) => {
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
                //get all existing data
                let existing = await db.BusySchedule.findAll({
                    where: { doctorId: data.doctorId, date: data.formatedDate },
                    attributes: ['doctorId', 'date', 'timeType', 'reason'],
                    raw: true
                });

                //compare different
                let toCreate = _.differenceWith(schedule, existing, (a, b) => {
                    return a.timeType === b.timeType && +a.date === +b.date;
                });

                // create data
                if (toCreate && toCreate.length <= 0) {
                    resolve({
                        errCode: 2,
                        errMessage: "Calendar already exists"
                    })
                }
                else if (toCreate && toCreate.length > 0) {
                    await db.BusySchedule.bulkCreate(toCreate);
                    resolve({
                        errCode: 0,
                        errMessage: 'Oke'
                    })
                }

            }

        } catch (e) {
            reject(e);
        }
    })
}

module.exports = {
    getTopDoctorHome: getTopDoctorHome,
    getAllDoctor: getAllDoctor,
    saveDetailInforDoctor: saveDetailInforDoctor,
    getDetailDoctorById: getDetailDoctorById,
    bulkCreateSchedule: bulkCreateSchedule,
    getScheduleByDate: getScheduleByDate,
    getExtraInfoDoctorById: getExtraInfoDoctorById,
    getProfileDoctorById: getProfileDoctorById,
    deleteDoctorSchedule: deleteDoctorSchedule,
    doctorSearch: doctorSearch,
    getTotalDoctor,
    createBusySchedule
}