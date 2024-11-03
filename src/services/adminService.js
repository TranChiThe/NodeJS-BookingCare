import { raw } from 'body-parser';
import db from '../models/index';
const { Op, fn, col } = require('sequelize');
import dotenv from 'dotenv';
dotenv.config();
import _, { includes, reject } from 'lodash'

let getAppointmentByTime = (type, month, year) => {
    return new Promise(async (resolve, reject) => {
        const where = {};
        if (!type) {
            resolve({
                errCode: 1,
                errMessage: 'Missing input',
            })
        } else {
            if (year) {
                where.createdAt = { [Op.gte]: new Date(year, 0, 1), [Op.lt]: new Date(year, 11, 31, 23, 59, 59) };
                where.roleId = type
            }
            if (month && year) {
                where.createdAt = {
                    [Op.gte]: new Date(year, month - 1, 1),
                    [Op.lt]: new Date(year, month, 1)
                };
                where.roleId = type
            }
            where.roleId = type
            try {
                const userCount = await db.User.count({ where });
                resolve({
                    errCode: 0,
                    errMessage: 'Oke',
                    data: userCount
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

            const patientCounts = await db.User.count({
                where: {
                    createdAt: {
                        [Op.between]: [startOfWeek, endOfWeek],
                    },
                    roleId: 'R2'
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

            const patientCounts = await db.User.count({
                where: {
                    createdAt: {
                        [Op.between]: [startOfMonth, endOfMonth],
                    },
                    roleId: 'R2'
                },
            });
            return patientCounts;
        })
    );
    return monthlyCounts;
};

// Hàm để tính số lượng bệnh nhân theo năm
const countPatientsByYear = async (year) => {
    const count = await db.User.count({
        where: {
            createdAt: {
                [Op.gte]: new Date(year, 0, 1), // Ngày đầu tiên của năm
                [Op.lt]: new Date(year + 1, 0, 1), // Ngày đầu tiên của năm sau
            },
            roleId: 'R2'
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


module.exports = {
    getAppointmentByTime,
    getCountPatientByTime
}