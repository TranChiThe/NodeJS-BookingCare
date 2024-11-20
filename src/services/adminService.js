import { raw } from 'body-parser';
import db from '../models/index';
const { Op, fn, col, where } = require('sequelize');
import dotenv from 'dotenv';
dotenv.config();
import _, { includes, reject } from 'lodash'

let getAppointmentByTime = (statusId, month, year) => {
    return new Promise(async (resolve, reject) => {
        const where = {};
        if (!statusId) {
            resolve({
                errCode: 1,
                errMessage: 'Missing input',
            })
        } else {
            if (year) {
                where.createdAt = { [Op.gte]: new Date(year, 0, 1), [Op.lt]: new Date(year, 11, 31, 23, 59, 59) };
                where.statusId = statusId
            }
            if (month && year) {
                where.createdAt = {
                    [Op.gte]: new Date(year, month - 1, 1),
                    [Op.lt]: new Date(year, month, 1)
                };
                where.statusId = statusId
            }
            where.statusId = statusId
            try {
                const appointmentCount = await db.Appointment.count({ where });
                const totalRevenue = await db.Appointment.sum('appointmentFee', { where });
                resolve({
                    errCode: 0,
                    errMessage: 'Oke',
                    data: {
                        appointmentCount,
                        totalRevenue: totalRevenue || 0
                    }
                })
            } catch (error) {
                console.error(error);
                reject(error)
            }
        }

    });
}

// Hàm để tính số lượng bệnh nhân theo tuần
const countPatientsByWeek = async (year, month) => {
    const weeklyCounts = await Promise.all(
        Array.from({ length: 5 }, async (_, week) => {
            const startOfWeek = new Date(year, month - 1, week * 7 + 1);
            const endOfWeek = new Date(year, month - 1, (week + 1) * 7);

            if (endOfWeek.getMonth() !== month - 1) {
                endOfWeek.setDate(0);
            }

            const patientCounts = await db.Appointment.count({
                where: {
                    createdAt: {
                        [Op.between]: [startOfWeek, endOfWeek],
                    },
                },
            });
            return patientCounts
        })
    );
    return weeklyCounts;
};

// Hàm để tính số lượng bệnh nhân theo tháng
const countPatientsByMonth = async (year) => {
    const monthlyCounts = await Promise.all(
        Array.from({ length: 12 }, async (_, month) => {
            const startOfMonth = new Date(year, month, 1);
            const endOfMonth = new Date(year, month + 1, 0); // Ngày cuối cùng của tháng

            const patientCounts = await db.Appointment.count({
                where: {
                    createdAt: {
                        [Op.between]: [startOfMonth, endOfMonth],
                    },
                },
            });
            return patientCounts;
        })
    );
    return monthlyCounts;
};

// Hàm để tính số lượng bệnh nhân theo năm
const countPatientsByYear = async (year) => {
    const count = await db.Appointment.count({
        where: {
            createdAt: {
                [Op.gte]: new Date(year, 0, 1), // Ngày đầu tiên của năm
                [Op.lt]: new Date(year + 1, 0, 1), // Ngày đầu tiên của năm sau
            },
        },

    });
    return count;
};

let getCountPatientByTime = (type, month, year) => {
    return new Promise(async (resolve, reject) => {
        if (!year || (type === 'weekly' && !month)) {
            resolve({
                errCode: 1,
                errMessage: 'Missing input'
            })
        }
        try {
            let result;
            let data = {};

            switch (type) {
                case 'weekly':
                    result = await countPatientsByWeek(year, month);
                    data = {
                        year,
                        month,
                        weeklyCounts: result,
                    };
                    break;
                case 'monthly':
                    result = await countPatientsByMonth(year);
                    data = {
                        year,
                        monthlyCounts: result,
                    };
                    break;
                case 'yearly':
                    result = await countPatientsByYear(year);
                    data = {
                        year,
                        yearlyCounts: result,
                    };
                    break;
                default:
                    data = {}
                    resolve({
                        errCode: 2,
                        errMessage: 'Error',
                        data: data
                    })
            }
            resolve({
                errCode: 0,
                errMessage: 'OK',
                data,
            });
        } catch (error) {
            console.error(error);
            reject(error)
        }
    });
}

let getDashBoardInfo = (type) => {
    return new Promise(async (resolve, reject) => {
        try {
            let userCount = 0, doctorCount = 0, patientCount = 0, appointmentCount = 0, commentCount = 0;
            if (!type) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing input parameter'
                });
            } else {
                if (type === 'user') {
                    userCount = await db.User.count();
                }
                if (type === 'doctor') {
                    doctorCount = await db.User.count({
                        where: { roleId: 'R2' }
                    });
                }
                if (type === 'patient') {
                    patientCount = await db.Patient.count();
                }
                if (type === 'appointment') {
                    appointmentCount = await db.Appointment.count();
                }
                if (type === 'comment') {
                    commentCount = await db.Comment.count();
                }
                resolve({
                    errCode: 0,
                    errMessage: 'Success',
                    data: {
                        userCount,
                        doctorCount,
                        patientCount,
                        appointmentCount,
                        commentCount
                    }
                });
            }
        } catch (e) {
            console.error('Error from server: ', e);
            reject({
                errCode: 2,
                errMessage: 'Internal server error'
            });
        }
    });
};

let getSystemCode = (page = 1, limit = 10) => {
    return new Promise(async (resolve, reject) => {
        try {
            const offset = (page - 1) * limit;
            let codeValue = await db.Allcode.findAll({
                offset: offset,
                limit: limit
            });
            const totalItems = await db.Allcode.count();
            const totalPages = Math.ceil(totalItems / limit);
            if (codeValue) {
                resolve({
                    errCode: 0,
                    errMessage: 'Oke',
                    data: codeValue,
                    pagination: {
                        currentPage: page,
                        limit: limit,
                        totalItems: totalItems,
                        totalPages: totalPages,
                    }
                });
            } else {
                resolve({
                    errCode: 1,
                    errMessage: 'Error from server'
                });
            }
        } catch (e) {
            console.error('Error from server: ', e);
            reject(e);
        }
    });
}

let addSystemCode = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.keyMap || !data.type || !data.valueVi || !data.valueEn) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing input parameter'
                })
            } else {
                let systemCode = await db.Allcode.findOne({
                    where: { keyMap: data.keyMap }
                })
                if (systemCode) {
                    resolve({
                        errCode: 2,
                        errMessage: 'Code already exists in the system'
                    })
                } else {
                    await db.Allcode.create({
                        keyMap: data.keyMap,
                        type: data.type,
                        valueVi: data.valueVi,
                        valueEn: data.valueEn
                    })
                    resolve({
                        errCode: 0,
                        errMessage: 'Oke'
                    })
                }
            }
        } catch (e) {
            console.error('Error from server: ', e);
            reject(e);
        }
    })
}

let editSystemCode = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.keyMap || !data.type || !data.valueVi || !data.valueEn) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing input parameter'
                })
            } else {
                let systemCode = await db.Allcode.findOne({
                    where: { keyMap: data.keyMap }
                })
                if (!systemCode) {
                    resolve({
                        errCode: 2,
                        errMessage: 'Code does not exists in the system'
                    })
                } else {
                    systemCode.keyMap = data.keyMap;
                    systemCode.type = data.type;
                    systemCode.valueVi = data.valueVi;
                    systemCode.valueEn = data.valueEn;
                    await systemCode.save();
                    resolve({
                        errCode: 0,
                        errMessage: 'Oke'
                    })
                }
            }
        } catch (e) {
            console.error('Error from server: ', e);
            reject(e);
        }
    })
}

let deleteSystemCode = async (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!id) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing input parameter'
                })
            } else {
                let systemCode = db.Allcode.findOne({
                    where: { id: id }
                })
                if (!systemCode) {
                    resolve({
                        errCode: 2,
                        errMessage: 'Code does not exists in the system'
                    })
                } else {
                    await db.Allcode.destroy({
                        where: { id: id }
                    })
                    resolve({
                        errCode: 0,
                        errMessage: 'Oke'
                    })
                }
            }
        } catch (e) {
            console.error('Error from server: ', e);
            reject(e);
        }
    })
}

module.exports = {
    getAppointmentByTime,
    getCountPatientByTime,
    getDashBoardInfo,
    getSystemCode,
    addSystemCode,
    editSystemCode,
    deleteSystemCode
}