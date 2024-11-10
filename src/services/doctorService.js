import { raw } from 'body-parser';
import db from '../models/index';
import { where, Op, sequelize } from 'sequelize';
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

let getAllDoctor = (specialtyId, clinicId) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Build the dynamic filter for Doctor_Infor
            let doctorInforWhere = {};
            if (specialtyId) doctorInforWhere.specialtyId = specialtyId;
            if (clinicId) doctorInforWhere.clinicId = clinicId;

            let doctors = await db.User.findAll({
                where: { roleId: 'R2' },
                attributes: { exclude: ['password', 'image'] },
                include: [
                    {
                        model: db.Doctor_Infor,
                        where: Object.keys(doctorInforWhere).length > 0 ? doctorInforWhere : undefined
                    }
                ],
                raw: true,
                nest: true
            });

            resolve({
                errCode: 0,
                data: doctors
            });
        } catch (e) {
            reject(e);
        }
    });
}

let checkRequiredFields = (inputData) => {
    let requiredFields = ['doctorId', 'contentHTML', 'contentMarkDown', 'selectedPrice',
        'selectedPayment', 'selectedProvince', 'selectedClinic', 'specialtyId'
    ];
    let isValid = true;
    let missingField = '';

    for (let field of requiredFields) {
        if (inputData[field] == null || inputData[field] === '') {
            isValid = false;
            missingField = field;
            break;
        }
    }

    return {
        isValid: isValid,
        missingField: missingField
    };
};

let saveDetailInforDoctor = (inputData) => {
    return new Promise(async (resolve, reject) => {
        try {
            let checkObj = checkRequiredFields(inputData);
            if (checkObj.isValid === false) {
                resolve({
                    errCode: 1,
                    errMessage: `Thiếu tham số: ${checkObj.missingField}`
                })
            }
            else {
                let doctorMarkDown = await db.MarkDown.findOne({
                    where: { doctorId: inputData.doctorId },
                    raw: false,
                })
                let doctorInfo = await db.Doctor_Infor.findOne({
                    where: { doctorId: inputData.doctorId },
                    raw: false,
                })

                if ((doctorMarkDown && doctorInfo) || doctorMarkDown || doctorInfo) {
                    resolve({
                        errCode: 2,
                        errMessage: `Doctor information already exists in the system!`
                    })
                } else {
                    await db.MarkDown.create({
                        contentHTML: inputData.contentHTML,
                        contentMarkDown: inputData.contentMarkDown,
                        description: inputData.description,
                        doctorId: inputData.doctorId,
                    })
                    await db.Doctor_Infor.create({
                        doctorId: inputData.doctorId,
                        priceId: inputData.selectedPrice,
                        paymentId: inputData.selectedPayment,
                        provinceId: inputData.selectedProvince,
                        specialtyId: inputData.selectedSpecialty,
                        clinicId: inputData.selectedClinic,
                        note: inputData.note
                    })
                    resolve({
                        errCode: 0,
                        errMessage: `Save detail info doctor succeed!`
                    })
                }
            }
        } catch (e) {
            reject(e);
        }
    })
}

let updateDetailInforDoctor = (inputData) => {
    return new Promise(async (resolve, reject) => {
        try {
            let checkObj = checkRequiredFields(inputData);
            if (checkObj.isValid === false) {
                resolve({
                    errCode: 1,
                    errMessage: `Thiếu tham số: ${checkObj.missingField}`
                })
            }
            else {
                let doctorMarkDown = await db.MarkDown.findOne({
                    where: { doctorId: inputData.doctorId },
                    raw: false,
                })
                let doctorInfo = await db.Doctor_Infor.findOne({
                    where: { doctorId: inputData.doctorId },
                    raw: false,
                })
                if (doctorMarkDown && doctorInfo) {
                    doctorMarkDown.contentHTML = inputData.contentHTML;
                    doctorMarkDown.contentMarkDown = inputData.contentMarkDown;
                    doctorMarkDown.description = inputData.description;
                    doctorMarkDown.updateAt = new Date();
                    await doctorMarkDown.save()

                    doctorInfo.doctorId = inputData.doctorId;
                    doctorInfo.priceId = inputData.selectedPrice;
                    doctorInfo.paymentId = inputData.selectedPayment;
                    doctorInfo.provinceId = inputData.selectedProvince;
                    doctorInfo.specialtyId = inputData.selectedSpecialty;
                    doctorInfo.clinicId = inputData.selectedClinic;
                    doctorInfo.note = inputData.note;
                    await doctorInfo.save();
                    resolve({
                        errCode: 0,
                        errMessage: `Save detail info doctor succeed!`
                    })
                } else {
                    resolve({
                        errCode: 2,
                        errMessage: `Doctor information does not exist in the system!`
                    })
                }
            }
        } catch (e) {
            reject(e);
        }
    })
}

let deleteDetailInforDoctor = (doctorId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!doctorId) {
                resolve({
                    errCode: 1,
                    errMessage: `Missing input parameter`
                })
                return;
            }
            else {
                let doctorMarkDown = await db.MarkDown.findOne({
                    where: { doctorId: doctorId },
                    raw: false,
                })

                let doctorInfo = await db.Doctor_Infor.findOne({
                    where: { doctorId: doctorId },
                    raw: false,
                })
                if (doctorInfo && doctorMarkDown) {
                    await db.MarkDown.destroy({
                        where: { doctorId: doctorId },
                    })

                    db.Doctor_Infor.destroy({
                        where: { doctorId: doctorId },
                    })
                    resolve({
                        errCode: 0,
                        errMessage: `Save detail info doctor succeed!`
                    })
                } else {
                    resolve({
                        errCode: 2,
                        errMessage: `Doctor information does not exist in the system!`
                    })
                }
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

                if (toCreate && toCreate.length <= 0) {
                    resolve({
                        errCode: 2,
                        errMessage: "Calendar already exists"
                    })
                }
                else if (toCreate && toCreate.length > 0) {
                    await db.Schedule.bulkCreate(toCreate);
                    resolve({
                        errCode: 0,
                        errMessage: 'Schedule created successfully, ignoring busy times.'
                    });
                }
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

let deleteDoctorSchedule = (timeType, status, date) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Ensure timeType, status, and date are valid
            if (!timeType || !status || !date) {
                reject({
                    errCode: 1,
                    errMessage: 'Missing required parameters: timeType, status, or date!'
                });
                return;
            }

            // Convert date to timestamp (if necessary) for comparison
            // const dateTimestamp = new Date(date).getTime();

            let appointment;

            // Check the status to determine whether we are deleting from the Schedule or BusySchedule table
            if (status === 'busy') {
                // Find the busy schedule record
                appointment = await db.BusySchedule.findOne({
                    where: {
                        timeType: timeType,
                        date: date
                    }
                });

                // If the busy schedule doesn't exist
                if (!appointment) {
                    resolve({
                        errCode: 1,
                        errMessage: 'Busy schedule does not exist'
                    });
                    return;
                }

                // Delete the busy schedule
                await db.BusySchedule.destroy({
                    where: {
                        timeType: timeType,
                        date: date
                    }
                });

                resolve({
                    errCode: 0,
                    errMessage: 'Busy schedule has been deleted successfully'
                });
            } else if (status === 'available') {
                // Find the working schedule record
                appointment = await db.Schedule.findOne({
                    where: {
                        timeType: timeType,
                        date: date
                    }
                });

                // If the working schedule doesn't exist
                if (!appointment) {
                    resolve({
                        errCode: 1,
                        errMessage: 'Working schedule does not exist'
                    });
                    return;
                }

                // Delete the working schedule
                await db.Schedule.destroy({
                    where: {
                        timeType: timeType,
                        date: date
                    }
                });

                resolve({
                    errCode: 0,
                    errMessage: 'Working schedule has been deleted successfully'
                });
            } else {
                resolve({
                    errCode: 1,
                    errMessage: 'Invalid status provided!'
                });
            }
        } catch (e) {
            // Log error for debugging
            console.error("Error deleting schedule:", e);
            reject({
                errCode: 500,
                errMessage: 'Internal server error'
            });
        }
    });
};

let doctorSearch = (searchTerm, specialtyId, clinicId, page = 1, limit = 5) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (page < 1 || limit < 1) {
                return reject({
                    errCode: 1,
                    errMessage: 'Page and limit must be positive integers'
                });
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
                order: [['createdAt', 'DESC']],
                attributes: {
                    exclude: ['password'],
                },
                limit: limit,
                offset: offset,
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

let getScheduleDoctorForWeek = (doctorId, weekNumber) => {
    const currentDate = new Date();
    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1 + (weekNumber - 1) * 7);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return new Promise(async (resolve, reject) => {
        try {
            // Lấy lịch bận trong tuần
            let busySchedules = await db.BusySchedule.findAll({
                where: {
                    doctorId,
                    date: {
                        [db.Sequelize.Op.between]: [startOfWeek.getTime(), endOfWeek.getTime()]
                    }
                }
            });

            // Lấy lịch làm việc trong tuần
            let workingSchedules = await db.Schedule.findAll({
                where: {
                    doctorId: doctorId,
                    date: {
                        [db.Sequelize.Op.between]: [startOfWeek.getTime(), endOfWeek.getTime()]
                    }
                }
            });

            const schedule = {};
            for (let date = new Date(startOfWeek); date <= endOfWeek; date.setDate(date.getDate() + 1)) {
                const formattedDate = date.getTime();
                schedule[formattedDate] = {
                    busy: busySchedules
                        .filter(bs => parseInt(bs.date, 10) === formattedDate)
                        .map(bs => bs.timeType),
                    working: workingSchedules
                        .filter(ws => parseInt(ws.date, 10) === formattedDate)
                        .map(ws => ws.timeType)
                };
            }

            resolve({
                errCode: 0,
                errMessage: 'Oke',
                data: schedule
            });
        } catch (error) {
            console.error('Error fetching schedule:', error);
            reject(error);
        }
    });
};

let getPatientAppointment = (doctorId, statusId, date, searchTerm, page = 1, limit = 5) => {
    return new Promise(async (resolve, reject) => {
        try {
            let searchConditions = {};
            if (page < 1 || limit < 1) {
                return reject({
                    errCode: 1,
                    errMessage: 'Page and limit must be positive integers'
                });
            }
            const offset = (page - 1) * limit;
            if (!doctorId || !statusId || !date) {
                return resolve({
                    errCode: 1,
                    errMessage: 'Missing input parameter'
                });
            } else {
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

                let appointment = await db.Appointment.findAndCountAll({
                    where: {
                        doctorId: doctorId,
                        statusId: statusId,
                        date: date
                    },
                    limit: parseInt(limit),
                    offset: offset,
                    order: [['date', 'DESC']],
                    include: [
                        { model: db.Allcode, as: 'statusData', attributes: ['valueEn', 'valueVi'] },
                        { model: db.Allcode, as: 'timeTypeAppointment', attributes: ['valueEn', 'valueVi'] },
                        {
                            model: db.Patient,
                            where: searchConditions,
                            as: 'appointmentData'
                        }
                    ],
                    raw: true,
                    nest: true,
                });

                const totalPages = Math.ceil(appointment.count / limit);

                resolve({
                    errCode: 0,
                    errMessage: 'Oke',
                    data: appointment.rows,
                    currentPage: parseInt(page),
                    totalPages: totalPages,
                    totalAppointments: appointment.count,
                });
            }
        } catch (error) {
            reject(error);
        }
    });
};

const postConfirmAppointment = async (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!id) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing input parameter'
                })
            }
            const appointment = await db.Appointment.findByPk(id);

            if (!appointment) {
                return reject({
                    errCode: 2,
                    errMessage: 'Appointment not found'
                });
            }

            if (appointment.statusId === 'S2') {
                appointment.statusId = 'S3';
            } else if (appointment.statusId === 'S3') {
                appointment.statusId = 'S4';
            } else {
                return reject({
                    errCode: 3,
                    errMessage: 'Status update not allowed for this state'
                });
            }

            await appointment.save();
            resolve({
                errCode: 0,
                errMessage: 'Appointment status updated successfully',
                appointment
            });
        } catch (e) {
            console.error('Error updating appointment:', e);
            reject(e);
        }
    });
};

const postCancelAppointment = async (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!id) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing input parameter'
                })
            }
            const appointment = await db.Appointment.findByPk(id);

            if (!appointment) {
                return reject({
                    errCode: 2,
                    errMessage: 'Appointment not found'
                });
            }

            if (appointment.statusId === 'S2') {
                appointment.statusId = 'S5';
            } else {
                return reject({
                    errCode: 3,
                    errMessage: 'Status update not allowed for this state'
                });
            }
            await appointment.save();
            resolve({
                errCode: 0,
                errMessage: 'Appointment status updated successfully',
                appointment
            });
        } catch (e) {
            console.error('Error updating appointment:', e);
            reject(e);
        }
    });
};


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
    createBusySchedule,
    getScheduleDoctorForWeek,
    updateDetailInforDoctor,
    deleteDetailInforDoctor,
    getPatientAppointment,
    postConfirmAppointment,
    postCancelAppointment
}