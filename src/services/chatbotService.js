import { raw } from 'body-parser';
import db from '../models/index';
import dotenv from 'dotenv';
import _, { includes, reject } from 'lodash'
import { where, Op, sequelize } from 'sequelize';
import { query } from 'express';
import axios from 'axios';
require('dotenv').config();
import { postCancelAppointment } from './doctorService'
const moment = require('moment');


// Chuẩn hóa dữ liệu
const normalizeString = (str) => {
    return str.toLowerCase().replace(/[^\w\sáàảãạâầẩẫậăắằẳẵặéèẻẽẹêếềểễệíìỉĩịóòỏõọôồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ]/g, '').trim();
};

// Loại bỏ ký tự đặc biệt
let escapeRegExp = (string) => {
    return string.replace(/[.*+?^=!:${}()|\[\]\/\\]/g, '\\$&');
}

const identifyKeywords = (query, entities) => {
    query = normalizeString(query);
    if (!Array.isArray(entities)) {
        entities = [entities];
    }
    let updatedQuery = query;
    entities.forEach(entity => {
        const keyword = normalizeString(entity);
        if (keyword) {
            const keywordRegex = new RegExp(`(\\s|^)${escapeRegExp(keyword)}(\\s|$)`, 'gi');
            updatedQuery = updatedQuery.replace(keywordRegex, ' ').trim();
        }
    });

    updatedQuery = updatedQuery.replace(/\s+/g, ' ').trim();
    return updatedQuery || query;
    // return updatedQuery
};

const extractAppointmentCode = (userMessage) => {
    const match = userMessage.match(/^\d{13}$/);
    return match ? match[0] : null;
};

function convertTimestampToDate(timestampStr) {
    // Chuyển đổi chuỗi thành số nguyên
    let timestamp = parseInt(timestampStr, 10);
    let date = new Date(timestamp);
    let formattedDate = date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
    return formattedDate;
}

let formatResponseWithNewLines = (response) => {
    return response.replace(/(!|\?|\.)(?=\s|$)/g, '$1\n');
};

const generateSearchCondition = (doctorName) => {
    const likeSearch = (field) => ({
        [field]: { [Op.like]: `%${doctorName}%` }
    });

    return {
        [Op.or]: [
            likeSearch('firstName'),
            likeSearch('lastName'),
            db.sequelize.where(
                db.sequelize.fn('CONCAT', db.sequelize.col('lastName'), ' ', db.sequelize.col('firstName')),
                { [Op.like]: `%${doctorName}%` }
            ),
            db.sequelize.where(
                db.sequelize.fn('CONCAT', db.sequelize.col('firstName'), ' ', db.sequelize.col('lastName')),
                { [Op.like]: `%${doctorName}%` }
            )
        ]
    };
};

let formatCurrencyVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(amount);
}


let getResponseMessageFromIntent = async (query) => {
    try {
        let response = await axios.post('http://127.0.0.1:5000/chat', { query })
        let data = response.data
        let fulfillmentText = data.response || '';
        let intent = await data.intent;
        let entities = data.entities
        console.log('check intent: ', intent);
        console.log('check entity: ', entities);
        switch (intent) {
            case 'greeting': {
                if (entities && entities.length > 0) {
                    fulfillmentText = fulfillmentText
                }
                break;
            }
            case 'thanks': {
                fulfillmentText = fulfillmentText
                break;
            }
            case 'goodbye': {
                fulfillmentText = fulfillmentText
                break;
            }
            case 'bookingAppointment': {
                try {
                    const BASE_URL = "/detail-doctor";
                    let entityName = entities;
                    let doctorName = identifyKeywords(query, entityName);
                    let searchCondition = generateSearchCondition(doctorName)
                    let dataDoctor = await db.User.findOne({
                        where: {
                            roleId: 'R2',
                            ...searchCondition
                        }

                    });
                    if (!dataDoctor) {
                        fulfillmentText = fulfillmentText
                    } else {
                        const facilityUrl = `${BASE_URL}/${dataDoctor?.id}`;
                        fulfillmentText = `${facilityUrl}`;
                    }
                } catch (e) {
                    console.error('Error', e);
                    fulfillmentText = 'Đã xảy ra lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.';
                }
                break;
            }
            case 'facilityAddress': {
                let entityName = entities && entities.length > 0 ? entities : null;
                let clinicName = identifyKeywords(query, entityName);
                if (clinicName === '') {
                    fulfillmentText = fulfillmentText;
                    break;
                }
                if (entityName) {
                    let clinic = await db.Clinic.findOne({
                        include: [
                            {
                                model: db.Allcode,
                                as: 'clinicData',
                                attributes: ['valueEn', 'valueVi'],
                                where: {
                                    [Op.or]: [
                                        { valueEn: { [Op.like]: `%${clinicName}%` } },
                                        { valueVi: { [Op.like]: `%${clinicName}%` } },
                                    ],
                                },
                            },
                        ],
                        raw: true,
                        nest: true,
                    });

                    if (clinic) {
                        fulfillmentText = `Cơ sở y tế "${clinicName}" nằm ở ${clinic.address}.`;
                    } else {
                        fulfillmentText = fulfillmentText
                    }
                }
                break;
            }
            case 'findAppointment': {
                let entityName = entities
                let appointmentId = identifyKeywords(query, entityName)
                let appointmentCode = extractAppointmentCode(appointmentId);
                if (!appointmentId) {
                    fulfillmentText = fulfillmentText
                } else {
                    try {
                        let appointment = await db.Appointment.findOne({
                            where: { recordId: appointmentId },
                            include: [
                                { model: db.Allcode, as: 'statusData', attributes: ['valueEn', 'valueVi'] },
                                { model: db.Allcode, as: 'timeTypeAppointment', attributes: ['valueEn', 'valueVi'] },
                                {
                                    model: db.User, as: 'doctorAppoitmentData',
                                    attributes: ['id', 'email', 'firstName', 'lastName', 'phoneNumber',]
                                }
                            ],
                            raw: true,
                            nest: true,
                        })
                        if (appointment) {
                            fulfillmentText = `Bạn có lịch hẹn với bác sĩ "${appointment.doctorAppoitmentData?.lastName} ${appointment.doctorAppoitmentData?.firstName}" 
                            vào ngày "${convertTimestampToDate(appointment.date)}" 
                            lúc "${appointment.timeTypeAppointment?.valueVi}." 
                            Trạng thái lịch hẹn "${appointment.statusData?.valueVi}"`
                        } else {
                            fulfillmentText = `Không tìm thấy mã hồ sơ của bạn. ` + fulfillmentText
                        }
                    } catch (e) {
                        fulfillmentText = fulfillmentText;
                    }
                    break;
                }
            }
            case "doctorSchedule": {
                try {
                    let entityNameDoctor = entities;
                    let doctorName = identifyKeywords(query, entityNameDoctor);
                    if (!doctorName || typeof doctorName !== 'string') {
                        fulfillmentText = fulfillmentText
                        break;
                    }
                    let searchCondition = generateSearchCondition(doctorName)
                    const currentDate = moment().startOf('day').toDate();
                    const currentTimestamp = currentDate.getTime();
                    // Truy vấn bác sĩ
                    let doctors = await db.User.findAll({
                        where: { roleId: 'R2', ...searchCondition },
                        attributes: ['firstName', 'lastName', 'id'],
                        include: [
                            {
                                model: db.Schedule,
                                as: 'doctorData',
                                attributes: ['date'],
                                where: {
                                    date: {
                                        [Op.gte]: currentTimestamp
                                    }
                                },
                                distinct: true
                            }
                        ],
                        raw: true,
                        nest: true
                    });
                    if (doctors && doctors.length > 0) {
                        let allWorkDates = [];
                        doctors.forEach(doctor => {
                            if (doctor.doctorData && Array.isArray(doctor.doctorData)) {
                                let workDates = doctor.doctorData.map(schedule =>
                                    convertTimestampToDate(schedule.date)
                                );
                                allWorkDates = allWorkDates.concat(workDates);
                            } else if (doctor.doctorData) {
                                allWorkDates.push(convertTimestampToDate(doctor.doctorData.date));
                            }
                        });

                        // Loại bỏ các ngày trùng lặp
                        allWorkDates = [...new Set(allWorkDates)];

                        if (allWorkDates.length > 0) {
                            fulfillmentText = `Bác sĩ "${doctors[0].lastName} ${doctors[0].firstName}" có lịch làm việc vào các ngày: ${allWorkDates.join(", ")}.`;
                        } else {
                            fulfillmentText = `Bác sĩ "${doctorName}" không có lịch làm việc.`;
                        }
                    }
                    else {
                        fulfillmentText = `Tôi không tìm thấy lịch làm việc bác sĩ nào có tên là "${doctorName}". Vui lòng kiểm tra lại thông tin.`;
                    }
                } catch (error) {
                    console.error('Error fetching doctor schedule:', error);
                    fulfillmentText = 'Đã xảy ra lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.';
                }
                break;
            }
            case 'cancelAppointment': {
                try {
                    const currentDate = moment().startOf('day').toDate();
                    const currentTimestamp = currentDate.getTime();
                    let entityName = entities
                    let recordId = identifyKeywords(query, entityName)
                    let appointmentCode = extractAppointmentCode(recordId);
                    if (recordId) {
                        // if (!appointmentCode && recordId === '') {
                        //     fulfillmentText = 'Mã hồ sơ không hợp lệ. Vui lòng nhập mã hồ sơ gồm 12 ký tự số.';
                        //     break;
                        // }
                        let appointmentId = await db.Appointment.findOne({
                            where: {
                                recordId: recordId,
                                date: {
                                    [Op.gte]: currentTimestamp
                                }
                            },
                            attributes: ['id', 'statusId']
                        })
                        if (appointmentId) {
                            const appointment = await db.Appointment.findByPk(appointmentId?.id);
                            if (!appointment) {
                                fulfillmentText = `Không tìm thấy lịch hẹn "${recordId}". Hãy kiểm tra lại.`
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
                                fulfillmentText = `Lịch hẹn của bạn đã được hủy thành công`
                            } else {
                                fulfillmentText = `Lịch hẹn chưa được xác nhận hoặc đã được hủy.`
                            }
                        } else {
                            fulfillmentText = `Không tìm thấy thông tin lịch hẹn của bạn. ` + fulfillmentText
                        }
                    } else {
                        fulfillmentText = fulfillmentText
                    }
                } catch (e) {
                    console.error("Error ", e)
                    fulfillmentText = 'Đã xảy ra lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.';
                }
                break;
            }
            case 'priceAppoitment': {
                try {
                    let entityNameDoctor = entities;
                    let doctorName = identifyKeywords(query, entityNameDoctor);
                    if (!doctorName || typeof doctorName !== 'string') {
                        fulfillmentText = fulfillmentText
                        break;
                    }
                    let searchCondition = generateSearchCondition(doctorName)
                    let priceAppointment = await db.User.findOne({
                        where: {
                            roleId: 'R2',
                            ...searchCondition
                        },
                        include: [
                            {
                                model: db.Doctor_Infor, attributes: ['priceId'],
                                include: [
                                    {
                                        model: db.Allcode,
                                        as: 'priceTypeData',
                                        attributes: ['valueVi']
                                    }
                                ]
                            }
                        ],
                        atraw: true,
                        nest: true
                    })
                    if (priceAppointment) {
                        const doctorInfo = priceAppointment?.Doctor_Infor;
                        if (doctorInfo && doctorInfo.priceTypeData) {
                            const price = doctorInfo.priceTypeData.valueVi;
                            fulfillmentText = `Bác sĩ "${doctorName}" có giá khám bệnh là "${formatCurrencyVND(price)}"`
                        } else {
                            fulfillmentText = `Không tìm thấy giá khám của bác sĩ "${doctorName}"`
                        }
                    } else if (priceAppointment === null) {
                        fulfillmentText = `Không tìm thấy thông tin bác sĩ. ` + fulfillmentText
                    }
                } catch (e) {
                    console.error('Error', e);
                    fulfillmentText = 'Đã xảy ra lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.';
                }
                break;
            }
            case 'doctorInfo': {
                try {
                    let entityNameDoctor = entities;
                    let doctorName = identifyKeywords(query, entityNameDoctor);
                    if (!doctorName || typeof doctorName !== 'string') {
                        fulfillmentText = fulfillmentText
                        break;
                    }
                    let searchCondition = generateSearchCondition(doctorName)
                    let doctor = await db.User.findOne({
                        where:
                        {
                            roleId: 'R2',
                            ...searchCondition
                        },
                        attributes: ['id', 'firstName', 'lastName'],
                        include: [
                            { model: db.Doctor_Infor, attributes: ['description'] }
                        ],
                        raw: true,
                        nest: true
                    })
                    if (doctor) {
                        let doctorInfo = doctor?.Doctor_Infor
                        if (doctor && doctorInfo) {
                            fulfillmentText = `Thông tin bác sĩ "${doctorName}": "${doctor.Doctor_Infor?.description}"`
                        } else if (doctorInfo === null) {
                            fulfillmentText = `Không tìm thấy thông tin bác sĩ bạn yêu cầu. Hãy thử lại!`
                        }
                    } else if (doctor === null) {
                        fulfillmentText = `Không tìm thấy thông tin bác sĩ. ` + fulfillmentText
                    }
                } catch (e) {
                    console.error('Error', e);
                    fulfillmentText = 'Đã xảy ra lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.';
                }
                break
            }
            case 'specialtyInfo': {
                try {
                    const BASE_URL = "/detail-specialty";
                    let entityName = entities;
                    let specialtyName = identifyKeywords(query, entityName);
                    const likeSearch = (field) => ({
                        [field]: { [Op.like]: `%${specialtyName}%` }
                    });
                    let searchCondition = {
                        [Op.or]: [likeSearch('valueEn'), likeSearch('valueVi')]
                    };
                    let dataSpecialty = await db.Specialty.findOne({
                        include: [
                            {
                                model: db.Allcode,
                                as: 'specialtyData',
                                where: searchCondition,
                                attributes: ['keyMap'],
                            }
                        ],
                        attributes: ['name'],
                        raw: true,
                        nest: true
                    });
                    if (!dataSpecialty) {
                        fulfillmentText = fulfillmentText
                    } else {
                        const specialtyUrl = `${BASE_URL}/${dataSpecialty?.name}`;
                        fulfillmentText = `${specialtyUrl}`;
                    }
                } catch (e) {
                    console.error('Error', e);
                    fulfillmentText = 'Đã xảy ra lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.';
                }
                break;
            }
            case 'facilityInfo': {
                try {
                    const BASE_URL = "/detail-clinic";
                    let entityName = entities;
                    let facilityName = identifyKeywords(query, entityName);
                    const likeSearch = (field) => ({
                        [field]: { [Op.like]: `%${facilityName}%` }
                    });
                    let searchCondition = {
                        [Op.or]: [likeSearch('valueEn'), likeSearch('valueVi')]
                    };
                    let dataFacility = await db.Clinic.findOne({
                        include: [
                            {
                                model: db.Allcode,
                                as: 'clinicData',
                                where: searchCondition,
                                attributes: ['keyMap'],
                            }
                        ],
                        attributes: ['name'],
                        raw: true,
                        nest: true
                    });
                    if (!dataFacility) {
                        fulfillmentText = fulfillmentText
                    } else {
                        const facilityUrl = `${BASE_URL}/${dataFacility?.name}`;
                        fulfillmentText = `${facilityUrl}`;
                    }
                } catch (e) {
                    console.error('Error', e);
                    fulfillmentText = 'Đã xảy ra lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.';
                }
                break;
            }
            default: {
                if (!fulfillmentText) {
                    fulfillmentText = 'Tôi không hiểu yêu cầu của bạn. Vui lòng thử lại.';
                }
                break;
            }
        }

        return formatResponseWithNewLines(fulfillmentText);
    } catch (error) {
        console.error('Error from chatbot:', error);
        throw new Error('Error processing intent');
    }
}
module.exports = {
    getResponseMessageFromIntent
};
