import db from '../models/index';
import dotenv from 'dotenv';
dotenv.config();
import emailService from './emailService'
import _, { defaults, first, reject } from 'lodash'
import { v4 as uuidv4 } from 'uuid';
import { where, Op, sequelize } from 'sequelize';

let buildUrlEmail = (token, patientId, date, timeType) => {
    let result = `${process.env.URL_REACT}/verify-booking?token=${token}&patientId=${patientId}&date=${date}&timeType=${timeType}`
    return result;
}

const morningTimes = ['T1', 'T2', 'T3', 'T4'];
const afternoonTimes = ['T5', 'T6', 'T7', 'T8'];


let postBookAppointment = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.email || !data.doctorId || !data.timeType || !data.scheduleTime) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing input parameter'
                });
                return;
            }

            let [user] = await db.Patient.findOrCreate({
                where: { email: data.email },
                defaults: {
                    email: data.email,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    birthday: data.birthday,
                    address: data.address,
                    phoneNumber: data.phoneNumber,
                    gender: data.genders,
                }
            });

            // Kiểm tra xem khung giờ đã đạt tối đa số lượng chưa
            let schedule = await db.Schedule.findOne({
                where: {
                    doctorId: data.doctorId,
                    date: data.date,
                    timeType: data.timeType,
                }
            });

            if (!schedule) {
                resolve({
                    errCode: 7,
                    errMessage: 'Schedule not found'
                });
                return;
            }

            // Kiểm tra số lượng lịch hẹn đã đặt (chỉ đếm các lịch hẹn đã xác nhận)
            let confirmedAppointmentsCount = await db.Appointment.count({
                where: {
                    doctorId: data.doctorId,
                    date: data.date,
                    timeType: data.timeType,
                    statusId: 'S2',
                }
            });

            if (confirmedAppointmentsCount >= schedule.maxNumber) {
                resolve({
                    errCode: 6,
                    errMessage: 'This time slot has reached the maximum number of confirmed appointments for this doctor.'
                });
                return;
            }

            // Kiểm tra lượt đặt lịch trong buổi sáng và buổi chiều
            let existingMorningAppointment = morningTimes.includes(data.timeType)
                ? await db.Appointment.findOne({
                    where: {
                        patientId: user.id,
                        date: data.date,
                        timeType: morningTimes,
                        statusId: 'S2',
                    }
                })
                : null;

            let existingAfternoonAppointment = afternoonTimes.includes(data.timeType)
                ? await db.Appointment.findOne({
                    where: {
                        patientId: user.id,
                        date: data.date,
                        timeType: afternoonTimes,
                        statusId: 'S2',
                    }
                })
                : null;

            if (existingMorningAppointment) {
                resolve({
                    errCode: 3,
                    errMessage: 'You already have a confirmed appointment in the morning.'
                });
                return;
            }
            if (existingAfternoonAppointment) {
                resolve({
                    errCode: 4,
                    errMessage: 'You already have a confirmed appointment in the afternoon.'
                });
                return;
            }

            // Gửi email và tạo hoặc lấy thông tin bệnh nhân
            let token = uuidv4();
            let existsSendEmail = await db.Appointment.findOne({
                where: {
                    doctorId: data.doctorId,
                    patientId: user.id,
                    date: data.date,
                    timeType: data.timeType
                }
            })
            if (!existsSendEmail) {
                await emailService.sendSimpleEmail({
                    recordId: data.scheduleTime,
                    receiverEmail: data.email,
                    time: data.timeString,
                    patientName: data.firstName,
                    doctorName: data.doctorName,
                    language: data.language,
                    redirectLink: buildUrlEmail(token, user.id, data.date, data.timeType),
                });
            }

            // Tạo lịch hẹn mới với trạng thái S1 (chưa xác nhận)
            let [appointment, created] = await db.Appointment.findOrCreate({
                where: {
                    patientId: user.id,
                    date: data.date,
                    timeType: data.timeType,
                    doctorId: data.doctorId,
                    statusId: 'S1',
                },
                defaults: {
                    fullName: data.fullName,
                    phoneNumber: data.relativesPhoneNumber,
                    statusId: 'S1',
                    doctorId: data.doctorId,
                    patientId: user.id,
                    date: data.date,
                    recordId: data.scheduleTime,
                    scheduleTime: data.scheduleTime,
                    timeType: data.timeType,
                    appointmentFee: data.appointmentFee,
                    reason: data.reason,
                    token: token,
                }
            });

            if (created) {
                resolve({
                    errCode: 0,
                    errMessage: 'Appointment created successfully. Please confirm your appointment via the email sent.'
                });
            } else {
                resolve({
                    errCode: 2,
                    errMessage: 'You have already created an appointment with this doctor at this time slot.'
                });
            }
        } catch (e) {
            reject(e);
        }
    });
};

let postVerifyBookAppointment = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.token) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameter'
                });
                return;
            }

            // Kiểm tra xem lịch hẹn đã được xác nhận hay chưa
            let existsAppointment = await db.Appointment.findOne({
                where: {
                    patientId: data.patientId,
                    date: data.date,
                    timeType: data.timeType,
                    statusId: 'S2'
                }
            });

            if (existsAppointment) {
                resolve({
                    errCode: 2,
                    errMessage: 'Your appointment has been confirmed or does not exist in the system, please check again!'
                });
                return;
            }

            // Tìm lịch hẹn với trạng thái chưa xác nhận
            let appointment = await db.Appointment.findOne({
                where: {
                    patientId: data.patientId,
                    date: data.date,
                    timeType: data.timeType,
                    token: data.token,
                    statusId: 'S1'
                },
                raw: false
            });

            if (appointment) {
                // Tìm schedule tương ứng để kiểm tra giới hạn số lượng
                let schedule = await db.Schedule.findOne({
                    where: {
                        doctorId: appointment.doctorId,
                        date: data.date,
                        timeType: data.timeType
                    },
                    raw: false
                });

                if (!schedule) {
                    resolve({
                        errCode: 3,
                        errMessage: 'Schedule not found'
                    });
                    return;
                }

                // Kiểm tra xem số lượng lịch hẹn đã đạt giới hạn chưa
                if (schedule.currentNumber >= schedule.maxNumber) {
                    resolve({
                        errCode: 4,
                        errMessage: 'This time slot has reached the maximum number of confirmed appointments for this doctor.'
                    });
                    return;
                }

                // Xác nhận lịch hẹn và cập nhật số lượng
                appointment.statusId = 'S2';
                await appointment.save();

                // Tăng currentNumber trong Schedule
                schedule.currentNumber += 1;
                await schedule.save();

                resolve({
                    errCode: 0,
                    errMessage: 'Update appointment succeeded!'
                });
            } else {
                resolve({
                    errCode: 2,
                    errMessage: 'Your appointment has been confirmed or does not exist in the system, please check again!'
                });
            }
        } catch (e) {
            reject(e);
        }
    });
};

let HomeSearch = (type, searchTerm) => {
    return new Promise(async (resolve, reject) => {
        try {
            let data = {};
            let searchCondition = {};

            // if (searchTerm) {
            const likeSearch = (field) => ({ [field]: { [Op.like]: `%${searchTerm}%` } });

            switch (type) {
                case 'FLT1':
                    // Tìm kiếm cho FLT1 (Clinic, Specialty, Doctor)
                    searchCondition.clinic = likeSearch('name');
                    searchCondition.specialty = {
                        [Op.or]: [likeSearch('valueEn'), likeSearch('valueVi')]
                    };
                    searchCondition.doctor = {
                        [Op.or]: [
                            likeSearch('firstName'),
                            likeSearch('lastName'),
                            db.sequelize.where(
                                db.sequelize.fn('CONCAT', db.sequelize.col('lastName'), ' ', db.sequelize.col('firstName')),
                                { [Op.like]: `%${searchTerm}%` }
                            ),
                            db.sequelize.where(
                                db.sequelize.fn('CONCAT', db.sequelize.col('firstName'), ' ', db.sequelize.col('lastName')),
                                { [Op.like]: `%${searchTerm}%` }
                            )
                        ]
                    };

                    // Tìm Clinic
                    data.dataClinic = await db.Clinic.findAll({
                        where: searchCondition.clinic,
                        limit: 5
                    });

                    // Tìm Specialty
                    data.dataSpecialty = await db.Specialty.findAll({
                        limit: 5,
                        include: [{
                            model: db.Allcode,
                            as: 'specialtyData',
                            where: searchCondition.specialty,
                            attributes: ['valueEn', 'valueVi']
                        }]
                    });

                    // Tìm Doctor
                    data.dataDoctor = await db.User.findAll({
                        where: { roleId: 'R2', ...searchCondition.doctor },
                        limit: 5,
                        order: [['createdAt', 'DESC']],
                        attributes: { exclude: ['password'] },
                        include: [
                            { model: db.Allcode, as: 'positionData', attributes: ['valueEn', 'valueVi'] },
                            { model: db.Allcode, as: 'genderData', attributes: ['valueEn', 'valueVi'] },
                            {
                                model: db.Doctor_Infor,
                                attributes: ['specialtyId', 'clinicId'],
                                include: [

                                ]
                            }
                        ],
                        raw: true,
                        nest: true
                    });
                    break;

                case 'FLT2':
                    // Tìm kiếm Clinic
                    data.dataClinic = await db.Clinic.findAll({
                        where: likeSearch('name'),
                        limit: 5,
                        // attributes: 
                    });
                    break;

                case 'FLT3':
                    // Tìm kiếm Specialty
                    searchCondition.specialty = {
                        [Op.or]: [likeSearch('valueEn'), likeSearch('valueVi')]
                    };
                    data.dataSpecialty = await db.Specialty.findAll({
                        limit: 5,
                        include: [{
                            model: db.Allcode,
                            as: 'specialtyData',
                            where: searchCondition.specialty,
                            attributes: ['valueEn', 'valueVi']
                        }],
                        raw: true,
                        nest: true
                    });
                    break;

                case 'FLT4':
                    // Tìm kiếm Doctor
                    searchCondition.doctor = {
                        [Op.or]: [
                            likeSearch('firstName'),
                            likeSearch('lastName'),
                            db.sequelize.where(
                                db.sequelize.fn('CONCAT', db.sequelize.col('lastName'), ' ', db.sequelize.col('firstName')),
                                { [Op.like]: `%${searchTerm}%` }
                            ),
                            db.sequelize.where(
                                db.sequelize.fn('CONCAT', db.sequelize.col('firstName'), ' ', db.sequelize.col('lastName')),
                                { [Op.like]: `%${searchTerm}%` }
                            )
                        ]
                    };
                    data.dataDoctor = await db.User.findAll({
                        where: { roleId: 'R2', ...searchCondition.doctor },
                        order: [['createdAt', 'DESC']],
                        attributes: { exclude: ['password'] },
                        limit: 5,
                        include: [
                            { model: db.Allcode, as: 'positionData', attributes: ['valueEn', 'valueVi'] },
                            { model: db.Allcode, as: 'genderData', attributes: ['valueEn', 'valueVi'] },
                            { model: db.Doctor_Infor, attributes: ['specialtyId', 'clinicId'] }
                        ],
                        raw: true,
                        nest: true
                    });
                    break;

                default:
                    return resolve({ errCode: 1, errMessage: 'Invalid type' });
            }
            // }

            resolve({
                errCode: 0,
                errMessage: 'Oke',
                data: data
            });
        } catch (e) {
            reject(e);
        }
    });
};

let getAllPatientAppointment = (email, recordId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!email || !recordId) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing input parameter!'
                })
            } else {
                let user = await db.Patient.findOne({
                    where: { email: email }
                })
                let record = await db.Appointment.findOne({
                    where: { recordId: recordId }
                })
                if (!user || !record) {
                    resolve({
                        errCode: 2,
                        errMessage: 'User not found'
                    })

                } else {
                    let appointment = await db.Appointment.findAll({
                        where: {
                            recordId: recordId
                        },
                        include: [
                            { model: db.Allcode, as: 'statusData', attributes: ['valueEn', 'valueVi'] },
                            { model: db.Allcode, as: 'timeTypeAppointment', attributes: ['valueEn', 'valueVi'] },
                            {
                                model: db.Patient,
                                where: { email: email },
                                as: 'appointmentData'
                            },
                            {
                                model: db.User, as: 'doctorAppoitmentData',
                                attributes: ['id', 'email', 'firstName', 'lastName', 'phoneNumber',]
                            }
                        ],
                        raw: true,
                        nest: true,
                    })
                    if (appointment) {
                        resolve({
                            errCode: 0,
                            errMessage: 'Oke',
                            appointment
                        })
                    } else {
                        resolve({
                            errCode: 3,
                            errMessage: 'Not found',
                        })
                    }

                }
            }
        } catch (e) {
            console.error('Error from server...', e);
            reject(e);
        }
    })
}
module.exports = {
    postBookAppointment,
    buildUrlEmail,
    postVerifyBookAppointment,
    HomeSearch,
    getAllPatientAppointment
}