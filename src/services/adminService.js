import { raw } from 'body-parser';
import db from '../models/index';
const { Op, fn, col } = require('sequelize');
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
            let userCount = 0, doctorCount = 0, patientCount = 0, appointmentCount = 0;
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
                resolve({
                    errCode: 0,
                    errMessage: 'Success',
                    data: {
                        userCount,
                        doctorCount,
                        patientCount,
                        appointmentCount
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

let postComment = () => {
    return new Promise(async (resolve, reject) => {
        try {

        } catch (e) {
            console.log('Error from server: ', e);
            reject(e);
        }
    })
}

module.exports = {
    getAppointmentByTime,
    getCountPatientByTime,
    getDashBoardInfo,
    postComment
}