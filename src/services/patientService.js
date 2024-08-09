import db from '../models/index';
import dotenv from 'dotenv';
dotenv.config();
import emailService from './emailService'
import _, { defaults, first, reject } from 'lodash'
import { v4 as uuidv4 } from 'uuid';

let buildUrlEmail = (doctorId, token) => {
    let result = `${process.env.URL_REACT}/verify-booking?token=${token}&doctorId=${doctorId}`
    return result;
}

let postBookAppointment = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.email || !data.doctorId || !data.timeType || !data.scheduleTime) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing requires parameter'
                })
            } else {
                // upsert patient
                let token = uuidv4(); // ⇨ '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
                await emailService.sendSimpleEmail({
                    receiverEmail: data.email,
                    time: data.timeString,
                    patientName: data.firstName,
                    doctorName: data.doctorName,
                    language: data.language,
                    redirectLink: buildUrlEmail(data.doctorId, token),
                })
                let users = await db.Patient.findOrCreate({
                    where: {
                        email: data.email,
                    },
                    defaults: {
                        email: data.email,
                        roleId: 'R3',
                        firstName: data.firstName,
                        lastName: data.lastName,
                        birthday: data.birthday,
                        address: data.address,
                        reason: data.reason,
                        phoneNumber: data.phoneNumber,
                        gender: data.genders,
                    }
                })

                // create a booking record
                if (users) {
                    await db.Booking.findOrCreate({
                        where: {
                            patientId: users[0].id,
                            doctorId: data.doctorId,
                        },
                        defaults: {
                            statusId: 'S1',
                            doctorId: data.doctorId,
                            patientId: users[0].id,
                            recordId: data.scheduleTime,
                            scheduleTime: data.scheduleTime,
                            timeType: data.timeType,
                            token: token,
                        }
                    })
                }
                resolve({
                    errCode: 0,
                    errMessage: 'Save account succeed'
                })
            }

        } catch (e) {
            reject(e);
        }
    })
}

let postVerifyBookAppointment = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.token || !data.doctorId) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing requires parameter'
                })
            } else {
                let appointment = await db.Booking.findOne({
                    where: {
                        doctorId: data.doctorId,
                        token: data.token,
                        statusId: 'S1',
                    },
                    raw: false
                })
                if (appointment) {
                    appointment.statusId = 'S2';
                    await appointment.save();
                    resolve({
                        errCode: 0,
                        errMessage: 'Update appointment succeed!'
                    })
                } else {
                    resolve({
                        errCode: 2,
                        errMessage: 'Your appointment has been confirmed or does not exist in the system, please check again!'
                    })
                }
            }
        } catch (e) {
            reject(e);
        }
    })
}

module.exports = {
    postBookAppointment,
    buildUrlEmail,
    postVerifyBookAppointment,
}