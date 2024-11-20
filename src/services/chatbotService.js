import { raw } from 'body-parser';
import db from '../models/index';
import dotenv from 'dotenv';
import _, { includes, reject } from 'lodash'
import { where, Op } from 'sequelize';
import { query } from 'express';
require('dotenv').config();

const { SessionsClient } = require('@google-cloud/dialogflow');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const sessionClient = new SessionsClient({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

// Create a new session client
const projectId = process.env.PROJECT_ID;
const sessionId = uuidv4();
const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);


const normalizeString = (str) => {
    // Chuẩn hóa chuỗi để loại bỏ ký tự đặc biệt và chuẩn hóa về chữ thường
    return str.toLowerCase().replace(/[^\w\sáàảãạâầẩẫậăắằẳẵặéèẻẽẹêếềểễệíìỉĩịóòỏõọôồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ]/g, '').trim();
};

let escapeRegExp = (string) => {
    return string.replace(/[.*+?^=!:${}()|\[\]\/\\]/g, '\\$&'); // Thêm dấu gạch chéo để tránh lỗi regex với các ký tự đặc biệt
}

const identifyKeywords = (query, entities) => {
    query = normalizeString(query);  // Chuẩn hóa câu truy vấn

    // Kiểm tra nếu entities không phải là mảng, chuyển thành mảng
    if (!Array.isArray(entities)) {
        entities = [entities];
    }

    // Duyệt qua từng entity và loại bỏ từ khóa khỏi câu truy vấn
    let updatedQuery = query;
    entities.forEach(entity => {
        const keyword = normalizeString(entity);
        if (keyword) {
            const keywordRegex = new RegExp(`(\\s|^)${escapeRegExp(keyword)}(\\s|$)`, 'gi');
            updatedQuery = updatedQuery.replace(keywordRegex, ' ').trim();  // Loại bỏ từ khóa
        }
    });

    updatedQuery = updatedQuery.replace(/\s+/g, ' ').trim();
    return updatedQuery || query;
};


let getResponseFromIntent = async (query, sessionId) => {
    const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);

    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: query,
                languageCode: 'vi',
            },
        },
    };

    try {
        const responses = await sessionClient.detectIntent(request);
        const result = responses[0].queryResult;
        const intent = result.intent.displayName;
        const entities = result.parameters.fields;
        let fulfillmentText = result.fulfillmentText || '';

        switch (intent) {
            case 'iAddress': {
                let entityName = [];
                if (entities['eAddress'] && entities['eAddress'].listValue) {
                    entities['eAddress'].listValue.values.forEach(value => {
                        if (value.stringValue) {
                            entityName.push(value.stringValue);
                        }
                    });
                } else if (entities['eAddress'] && entities['eAddress'].stringValue) {
                    entityName.push(entities['eAddress'].stringValue);
                } else {
                    console.log('No eAddress entity found.');
                }

                let clinicName = identifyKeywords(query, entityName);
                console.log('check entity name: ', entityName);
                console.log('check clinic info: ', clinicName);
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
                        fulfillmentText = `Không tìm thấy cơ sở y tế "${clinicName}" trong hệ thống của chúng tôi.`;
                    }
                } else {
                    fulfillmentText = result.fulfillmentText
                    // fulfillmentText = 'Tôi không hiểu yêu cầu của bạn. Vui lòng thử lại.';
                }
                break;
            }

            case 'iAppointment': {
                // fulfillmentText = 'Bạn muốn tìm lịch hẹn của mình?'
                fulfillmentText = result.fulfillmentText
                break;
            }

            default: {
                if (!fulfillmentText) {
                    fulfillmentText = 'Tôi không hiểu yêu cầu của bạn. Vui lòng thử lại.';
                }
                break;
            }

        }

        return fulfillmentText;
    } catch (error) {
        console.error('Error from Dialogflow:', error);
        throw new Error('Error processing intent');
    }
};

module.exports = {
    getResponseFromIntent,
};
