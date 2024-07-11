import db from '../models/index';
import dotenv from 'dotenv';
dotenv.config();
import _, { first } from 'lodash'


let postBookAppointment = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.email || !data.doctorId || !data.timeType || !data.date) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing requires parameter'
                })
            } else {
                // upsert patient
                let users = await db.User.findOrCreate({
                    where: { email: data.email },
                    default: {
                        email: data.email,
                        firstName: data.firstName,
                        lastName: data.lastName,
                        roleId: 'R3',
                    }
                })

                // create a booking record
                if (users) {
                    await db.Booking.findOrCreate({
                        where: { patientId: users[0].id },
                        defaults: {
                            statusId: 'S1',
                            doctorId: data.doctorId,
                            patientId: users[0].id,
                            date: data.date,
                            timeType: data.timeType
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

module.exports = {
    postBookAppointment,
}