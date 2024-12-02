import { raw } from 'body-parser';
import db from '../models/index';
import { where, Op, Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();
import _, { includes, orderBy, reject } from 'lodash'
const cron = require('node-cron');
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
    let requiredFields = ['doctorId', 'selectedPrice', 'contentHTML', 'description', 'contentMarkDown',
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

let checkRequiredFieldsEn = (inputData) => {
    let requiredFields = ['selectedPrice', 'contentHTMLEn', 'descriptionEn', 'contentMarkDownEn',
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
            let checkObjEn = checkRequiredFieldsEn(inputData);
            if (inputData.language === 'vi') {
                if (checkObj.isValid === false) {
                    resolve({
                        errCode: 1,
                        errMessage: `Thiếu tham số: ${checkObj.missingField}`
                    })
                } else {
                    let doctorInfo = await db.Doctor_Infor.findOne({
                        where: { doctorId: inputData.doctorId },
                        raw: false,
                    })
                    if (doctorInfo) {
                        resolve({
                            errCode: 2,
                            errMessage: `Doctor information already exists in the system!`
                        })
                    } else {
                        await db.Doctor_Infor.create({
                            language: inputData.language,
                            doctorId: inputData.doctorId,
                            priceId: inputData.selectedPrice,
                            paymentId: inputData.selectedPayment,
                            provinceId: inputData.selectedProvince,
                            specialtyId: inputData.selectedSpecialty,
                            clinicId: inputData.selectedClinic,
                            note: inputData.note,
                            contentHTML: inputData.contentHTML,
                            contentMarkDown: inputData.contentMarkDown,
                            description: inputData.description,
                            contentHTMLEn: '',
                            contentMarkDownEn: '',
                            descriptionEn: '',
                            noteEn: ''
                        })
                        resolve({
                            errCode: 0,
                            errMessage: `Save detail info doctor succeed!`
                        })
                    }
                }
            } else if (inputData.language === 'en') {
                if (checkObjEn.isValid === false) {
                    resolve({
                        errCode: 1,
                        errMessage: `Thiếu tham số: ${checkObj.missingField}`
                    })
                } else {
                    let doctorInfo = await db.Doctor_Infor.findOne({
                        where: { doctorId: inputData.doctorId },
                        raw: false,
                    })
                    if (doctorInfo) {
                        doctorInfo.doctorId = inputData.doctorId;
                        doctorInfo.priceId = inputData.selectedPrice;
                        doctorInfo.paymentId = inputData.selectedPayment;
                        doctorInfo.provinceId = inputData.selectedProvince;
                        doctorInfo.specialtyId = inputData.selectedSpecialty;
                        doctorInfo.clinicId = inputData.selectedClinic;
                        doctorInfo.noteEn = inputData.noteEn;
                        doctorInfo.contentHTMLEn = inputData.contentHTMLEn;
                        doctorInfo.contentMarkDownEn = inputData.contentMarkDownEn;
                        doctorInfo.descriptionEn = inputData.descriptionEn;
                        doctorInfo.updateAt = new Date();
                        await doctorInfo.save();
                        resolve({
                            errCode: 0,
                            errMessage: `Save detail info doctor succeed!`
                        })
                    } else {
                        resolve({
                            errCode: 3,
                            errMessage: `You need to enter Vietnamese language information first.!`
                        })
                    }
                }
            }
        } catch (e) {
            reject(e);
        }
    })
}

let updateDetailInforDoctor = (inputData) => {
    return new Promise(async (resolve, reject) => {
        let checkObj = checkRequiredFields(inputData);
        let checkObjEn = checkRequiredFieldsEn(inputData);
        try {
            let doctorInfo = await db.Doctor_Infor.findOne({
                where: { doctorId: inputData.doctorId },
                raw: false,
            })
            if (inputData.language === 'en') {
                if (checkObjEn.isValid === false) {
                    resolve({
                        errCode: 1,
                        errMessage: `Thiếu tham số: ${checkObj.missingField}`
                    })
                } else {
                    if (doctorInfo) {
                        doctorInfo.doctorId = inputData.doctorId;
                        doctorInfo.priceId = inputData.selectedPrice;
                        doctorInfo.paymentId = inputData.selectedPayment;
                        doctorInfo.provinceId = inputData.selectedProvince;
                        doctorInfo.specialtyId = inputData.selectedSpecialty;
                        doctorInfo.clinicId = inputData.selectedClinic;
                        doctorInfo.noteEn = inputData.noteEn;
                        doctorInfo.contentHTMLEn = inputData.contentHTMLEn;
                        doctorInfo.contentMarkDownEn = inputData.contentMarkDownEn;
                        doctorInfo.descriptionEn = inputData.descriptionEn;
                        doctorInfo.updateAt = new Date();
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
            } else if (inputData.language === 'vi') {
                if (checkObj.isValid === false) {
                    resolve({
                        errCode: 1,
                        errMessage: `Thiếu tham số: ${checkObj.missingField}`
                    })
                } else {
                    if (doctorInfo) {
                        doctorInfo.doctorId = inputData.doctorId;
                        doctorInfo.priceId = inputData.selectedPrice;
                        doctorInfo.paymentId = inputData.selectedPayment;
                        doctorInfo.provinceId = inputData.selectedProvince;
                        doctorInfo.specialtyId = inputData.selectedSpecialty;
                        doctorInfo.clinicId = inputData.selectedClinic;
                        doctorInfo.note = inputData.note;
                        doctorInfo.contentHTML = inputData.contentHTML;
                        doctorInfo.contentMarkDown = inputData.contentMarkDown;
                        doctorInfo.description = inputData.description;
                        doctorInfo.updateAt = new Date();
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
                let doctorInfo = await db.Doctor_Infor.findOne({
                    where: { doctorId: doctorId },
                    raw: false,
                })
                if (doctorInfo) {
                    await db.Doctor_Infor.destroy({
                        where: { doctorId: doctorId },
                    })
                    resolve({
                        errCode: 0,
                        errMessage: `Delete detail info doctor succeed!`
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
                    errMessage: 'Missing required parameter!'
                });
            } else {
                let dataSchedule = await db.Schedule.findAll({
                    where: {
                        doctorId: doctorId,
                        date: date,
                        currentNumber: { [db.Sequelize.Op.lt]: db.Sequelize.col('maxNumber') } // Điều kiện so sánh
                    },
                    include: [
                        {
                            model: db.Allcode, as: 'timeTypeData', attributes: ['valueEn', 'valueVi']
                        },
                        {
                            model: db.User, as: 'doctorData', attributes: ['firstName', 'lastName']
                        }
                    ],
                    raw: false,
                    nest: true
                });

                let positionData = await db.User.findAll({
                    where: { id: doctorId },
                    raw: true
                });

                if (!dataSchedule || dataSchedule.length === 0) {
                    resolve({
                        errCode: 2,
                        errMessage: 'No available schedule!'
                    });
                } else {
                    resolve({
                        errCode: 0,
                        data: dataSchedule,
                        positionData: positionData
                    });
                }
            }
        } catch (e) {
            reject(e);
        }
    });
};

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
                        { model: db.Allcode, as: 'clinicTypeData', attributes: ['valueEn', 'valueVi'] },
                        { model: db.Clinic, attributes: ['address', 'addressEn'] },
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
    currentDate.setHours(0, 0, 0, 0); // Đặt về đầu ngày

    const dayOfWeek = currentDate.getDay(); // 0 = Chủ nhật, 1 = Thứ Hai, ...
    const startOfWeek = new Date(currentDate);

    // Nếu tuần bắt đầu từ Thứ Hai
    const dayOffset = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek; // Chủ nhật (0) lùi 6 ngày, còn lại lùi đúng số ngày
    startOfWeek.setDate(currentDate.getDate() + dayOffset + (weekNumber - 1) * 7);

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
            let recordSearch = {};
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

                    recordSearch = {
                        recordId: { [Op.like]: `%${searchTerm}%` }
                    };
                }

                let appointment = await db.Appointment.findAndCountAll({
                    where: {
                        doctorId: doctorId,
                        statusId: statusId,
                        date: date,
                        ...recordSearch
                    },
                    limit: parseInt(limit),
                    offset: offset,
                    order: [['date', 'DESC']],
                    include: [
                        { model: db.Allcode, as: 'statusData', attributes: ['valueEn', 'valueVi'] },
                        { model: db.Allcode, as: 'timeTypeAppointment', attributes: ['valueEn', 'valueVi'] },
                        {
                            model: db.Patient,
                            // where: searchConditions,
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
                });
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

                const schedule = await db.Schedule.findOne({
                    where: {
                        doctorId: appointment.doctorId,
                        date: appointment.date,
                        timeType: appointment.timeType
                    }
                });

                if (schedule) {
                    schedule.currentNumber = Math.max(schedule.currentNumber - 1, 0);
                    await schedule.save();
                }

                await appointment.save();
                resolve({
                    errCode: 0,
                    errMessage: 'Appointment status updated successfully',
                    appointment
                });
            } else {
                return reject({
                    errCode: 3,
                    errMessage: 'Status update not allowed for this state'
                });
            }
        } catch (e) {
            console.error('Error updating appointment:', e);
            reject(e);
        }
    });
};

let getDoctorComment = (doctorId, page = 1, limit = 3) => {
    return new Promise(async (resolve, reject) => {
        try {
            const offset = (page - 1) * limit;
            if (!doctorId) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing input parameter'
                })
            } else {
                let comment = await db.Comment.findAndCountAll({
                    where: { doctorId: doctorId },
                    order: [
                        ['createdAt', 'DESC']
                    ],
                    limit: limit,
                    offset: offset,
                    include: [
                        { model: db.Patient, as: 'patientComment', attributes: ['firstName', 'lastName'] }
                    ],
                    raw: true,
                    nest: true
                })
                const totalPages = Math.ceil(comment.count / limit);
                if (comment) {
                    resolve({
                        errCode: 0,
                        errMessage: 'Oke',
                        data: comment.rows,
                        currentPage: parseInt(page),
                        totalPages: totalPages
                    })
                } else {
                    resolve({
                        errCode: 2,
                        errMessage: 'Comment not found!'
                    })
                }
            }
        } catch (e) {
            console.log('Error from server: ', e);
            reject(e);
        }
    })
}

let getAllDoctorCommentByDate = (doctorId, startDate, endDate, page = 1, limit = 15) => {
    return new Promise(async (resolve, reject) => {
        try {
            const offset = (page - 1) * limit;
            if (!doctorId) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing input parameter'
                })
            } else {
                let comment = await db.Comment.findAndCountAll({
                    where: {
                        doctorId: doctorId,
                        createdAt: {
                            [db.Sequelize.Op.between]: [startDate, endDate],
                        },
                    },
                    order: [
                        ['createdAt', 'DESC']
                    ],
                    limit: limit,
                    offset: offset,
                    include: [
                        { model: db.Patient, as: 'patientComment', attributes: ['firstName', 'lastName'] },
                        { model: db.User, as: 'doctorComment', attributes: ['firstName', 'lastName'] },
                    ],
                    raw: true,
                    nest: true
                })
                const totalPages = Math.ceil(comment.count / limit);
                if (comment) {
                    resolve({
                        errCode: 0,
                        errMessage: 'Oke',
                        data: comment.rows,
                        currentPage: parseInt(page),
                        totalPages: totalPages
                    })
                } else {
                    resolve({
                        errCode: 2,
                        errMessage: 'Comment not found!'
                    })
                }
            }
        } catch (e) {
            console.log('Error from server: ', e);
            reject(e);
        }
    })
}

let deleteDoctorComment = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!id) {
                resolve({
                    errCode: 0,
                    errMessage: 'Missing input parameter'
                })
            } else {
                let comment = await db.Comment.findOne({
                    where: { id: id }
                })
                if (comment) {
                    await db.Comment.destroy({
                        where: { id: id }
                    })
                    resolve({
                        errCode: 0,
                        errMessage: 'Oke'
                    })
                } else {
                    resolve({
                        errCode: 2,
                        errMessage: "Comment does not exists"
                    })
                }
            }
        } catch (e) {
            console.log('Error from server ', e);
            reject(e);
        }
    })
}

cron.schedule('0 */6 * * *', async () => {
    try {
        const twelveHoursAgo = Date.now() - 12 * 60 * 60 * 1000; // 12 giờ trước
        // const fiveMinutesAgo  = Date.now() - 5 * 60 * 1000; // 5 phút trước
        const expiredAppointments = await db.Appointment.findAll({
            where: {
                statusId: 'S1',
                createdAt: {
                    [Op.lt]: new Date(twelveHoursAgo),
                },
            },
        });

        // Hủy các lịch hẹn hết hạn
        await Promise.all(
            expiredAppointments.map((appointment) =>
                appointment.update({ statusId: 'S5' })
            )
        );

        console.log(`Đã hủy ${expiredAppointments.length} lịch hẹn hết hạn.`);
    } catch (error) {
        console.error('Lỗi khi hủy lịch hẹn:', error);
    }
});

module.exports = {
    getTopDoctorHome,
    getAllDoctor,
    saveDetailInforDoctor,
    getDetailDoctorById,
    bulkCreateSchedule,
    getScheduleByDate,
    getExtraInfoDoctorById,
    getProfileDoctorById,
    deleteDoctorSchedule,
    doctorSearch,
    getTotalDoctor,
    createBusySchedule,
    getScheduleDoctorForWeek,
    updateDetailInforDoctor,
    deleteDetailInforDoctor,
    getPatientAppointment,
    postConfirmAppointment,
    postCancelAppointment,
    getDoctorComment,
    getAllDoctorCommentByDate,
    deleteDoctorComment
}