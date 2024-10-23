import db from '../models/index';
import dotenv from 'dotenv';
dotenv.config();
import emailService from './emailService'
import _, { defaults, first, reject } from 'lodash'
import { v4 as uuidv4 } from 'uuid';
import { where, Op, sequelize } from 'sequelize';

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
                    await db.Appointment.findOrCreate({
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
                let appointment = await db.Appointment.findOne({
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

// let HomeSearch = (type, searchTerm) => {
//     return new Promise(async (resolve, reject) => {
//         try {
//             let data = {};
//             if (type === 'FLT1') {
//                 let searchConditionClinic = {};
//                 let searchConditionSpecialty = {};
//                 let searchConditionDoctor = {};
//                 if (searchTerm) {
//                     searchConditionClinic = {
//                         name: {
//                             [Op.like]: `%${searchTerm}%`
//                         }
//                     }
//                     searchConditionSpecialty[Op.or] = [
//                         { valueEn: { [Op.like]: `%${searchTerm}%` } },
//                         { valueVi: { [Op.like]: `%${searchTerm}%` } },
//                     ];
//                     searchConditionDoctor[Op.or] = [
//                         { firstName: { [Op.like]: `%${searchTerm}%` } },
//                         { lastName: { [Op.like]: `%${searchTerm}%` } },
//                         db.sequelize.where(
//                             db.sequelize.fn('CONCAT', db.sequelize.col('firstName'), ' ', db.sequelize.col('lastName')),
//                             { [Op.like]: `%${searchTerm}%` }
//                         )
//                     ];
//                 }

//                 let dataClinic = await db.Clinic.findAll({
//                     where: searchConditionClinic,
//                     attributes: { exclude: ['image'] },
//                 });

//                 let dataSpecialty = await db.Specialty.findAll({
//                     attributes: { exclude: ['image'] },
//                     include: [{
//                         model: db.Allcode,
//                         as: 'specialtyData',
//                         where: searchConditionSpecialty,
//                         attributes: ['valueEn', 'valueVi']
//                     }],
//                 });

//                 let dataDoctor = await db.User.findAll({
//                     where: { roleId: 'R2', ...searchConditionDoctor },
//                     order: [['createdAt', 'DESC']],
//                     attributes: { exclude: ['password'] },
//                     include: [
//                         { model: db.Allcode, as: 'positionData', attributes: ['valueEn', 'valueVi'] },
//                         { model: db.Allcode, as: 'genderData', attributes: ['valueEn', 'valueVi'] },
//                         { model: db.Doctor_Infor, attributes: ['specialtyId', 'clinicId'] }
//                     ],
//                     raw: true,
//                     nest: true,
//                 });

//                 data.dataClinic = dataClinic;
//                 data.dataSpecialty = dataSpecialty;
//                 data.dataDoctor = dataDoctor;
//             }
//             else if (type === 'FLT2') {
//                 let searchConditions = {};
//                 if (searchTerm) {
//                     searchConditions = {
//                         name: { [Op.like]: `%${searchTerm}%` }
//                     };
//                 }
//                 data = await db.Clinic.findAll({
//                     where: searchConditions,
//                     attributes: { exclude: ['image'] }
//                 });
//             }
//             else if (type === 'FLT3') {
//                 let searchConditions = {};
//                 if (searchTerm) {
//                     searchConditions[Op.or] = [
//                         { valueEn: { [Op.like]: `%${searchTerm}%` } },
//                         { valueVi: { [Op.like]: `%${searchTerm}%` } },
//                     ];
//                 }
//                 data = await db.Specialty.findAll({
//                     attributes: { exclude: ['image'] },
//                     include: [{
//                         model: db.Allcode,
//                         as: 'specialtyData',
//                         where: searchConditions,
//                         attributes: ['valueEn', 'valueVi']
//                     }],
//                     raw: true,
//                     nest: true,
//                 });
//             }
//             else if (type === 'FLT4') {
//                 let searchConditions = {};
//                 if (searchTerm) {
//                     searchConditions[Op.or] = [
//                         { firstName: { [Op.like]: `%${searchTerm}%` } },
//                         { lastName: { [Op.like]: `%${searchTerm}%` } },
//                         db.sequelize.where(
//                             db.sequelize.fn('CONCAT', db.sequelize.col('firstName'), ' ', db.sequelize.col('lastName')),
//                             { [Op.like]: `%${searchTerm}%` }
//                         )
//                     ];
//                 }
//                 data = await db.User.findAll({
//                     where: { roleId: 'R2', ...searchConditions },
//                     order: [['createdAt', 'DESC']],
//                     attributes: { exclude: ['password'] },
//                     include: [
//                         { model: db.Allcode, as: 'positionData', attributes: ['valueEn', 'valueVi'] },
//                         { model: db.Allcode, as: 'genderData', attributes: ['valueEn', 'valueVi'] },
//                         { model: db.Doctor_Infor, attributes: ['specialtyId', 'clinicId'] }
//                     ],
//                     raw: true,
//                     nest: true,
//                 });
//             }

//             resolve({
//                 errCode: 0,
//                 errMessage: 'Oke',
//                 data: data
//             });
//         } catch (e) {
//             reject(e);
//         }
//     });
// }

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
                        attributes: { exclude: ['image'] }
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


module.exports = {
    postBookAppointment,
    buildUrlEmail,
    postVerifyBookAppointment,
    HomeSearch,
}