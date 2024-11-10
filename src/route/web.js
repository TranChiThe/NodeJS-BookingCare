import express from "express"
import authController from '../controllers/authController';
import userController from "../controllers/userController"
import doctorController from '../controllers/doctorController';
import patientController from '../controllers/patientController'
import specialtyController from '../controllers/specialtyController'
import middlewareController from '../controllers/middlewareController'
import clinicController from '../controllers/clinicController'
import adminController from '../controllers/adminController'
const { SessionsClient } = require('@google-cloud/dialogflow');
const path = require('path');
const { v4: uuidv4 } = require('uuid');


require('dotenv').config();
const sessionClient = new SessionsClient({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

// Create a new session client
const projectId = process.env.PROJECT_ID;
const sessionId = uuidv4();
const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);
console.log(`Session path: ${sessionPath}`);

let router = express.Router();
let initWebRouter = (app) => {

    // ------------------------ AUTHENTICATION ------------------------------\\
    router.post('/api/user-register', authController.handleUserRegister);
    router.post('/api/login', authController.handleLogin);
    router.post('/api/refresh-token', authController.refreshToken);
    router.post('/api/logout', middlewareController.verifyToken, authController.logOut);

    // ------------------------ API CHATBOT ------------------------------\\

    // Xử lý yêu cầu từ người dùng
    router.post('/webhook', async (req, res) => {
        const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);

        const request = {
            session: sessionPath,
            queryInput: {
                text: {
                    text: req.body.query,
                    languageCode: 'vi',
                },
            },
        };

        try {
            const responses = await sessionClient.detectIntent(request);
            const result = responses[0].queryResult;

            // Gửi phản hồi lại cho người dùng
            res.json({
                fulfillmentText: result.fulfillmentText,
            });
        } catch (error) {
            console.error('Error detecting intent:', error);
            res.status(500).send('Error detecting intent');
        }
    });

    // ------------------------ API ADMIN ------------------------------\\
    router.get('/api/get-appointment-by-time', adminController.getAppointmentByTime)
    router.get('/api/get-count-patient-by-time', adminController.getCountPatientByTime)
    router.get('/api/get-dashboard-info', adminController.getDashBoardInfo)


    // ------------------------ API USER ------------------------------\\
    router.get('/api/get-all-users', middlewareController.verifyTokenAdmin, userController.handleGetAllUser);
    router.post('/api/create-new-user', middlewareController.verifyTokenAdmin, userController.handleCreateNewUser);
    router.put('/api/edit-user', middlewareController.verifyTokenAdmin, userController.handleEditUser);
    router.delete('/api/delete-user', middlewareController.verifyTokenAdmin, userController.handleDeleteUser);
    router.get('/api/get-allcode', userController.getAllCode);

    //------------------------ API DOCTOR ---------------------------\\
    router.get('/api/get-doctor-home', doctorController.getDoctorHome);
    router.get('/api/get-all-doctor', doctorController.getAllDoctor);
    router.post('/api/save-infor-doctor', doctorController.saveInforDoctor);
    router.post('/api/update-infor-doctor', doctorController.updateInforDoctor);
    router.delete('/api/delete-infor-doctor', doctorController.deleteInforDoctor);
    router.get('/api/get-detail-doctor-by-id', doctorController.getDetailDoctorById);
    router.post('/api/bulk-create-schedule', doctorController.bulkCreateSchedule);
    router.get('/api/get-schedule-doctor-by-date', doctorController.getScheduleDoctorByDate);
    router.get('/api/get-extra-info-doctor-by-id', doctorController.getExtraInfoDoctorById);
    router.get('/api/get-profile-doctor-by-id', doctorController.getProfileDoctorById);
    router.get('/api/get-all-doctor-schedule', doctorController.getAllDoctorSchedule);
    router.delete('/api/delete-doctor-schedule', doctorController.deleteDoctorSchedule);
    router.get('/api/doctor-search', doctorController.doctorSearch);
    router.post('/api/get-total-doctor', doctorController.getTotalDoctor);
    router.post('/api/busy-schedule', doctorController.createBusySchedule);
    router.get('/api/get-schedule-for-week', doctorController.getScheduleDoctorForWeek);
    router.get('/api/get-patient-appointment', doctorController.getPatientAppointment);
    router.put('/api/post-confirm-appointment', doctorController.postConfirmAppointment);
    router.put('/api/post-cancel-appointment', doctorController.postCancelAppointment);




    //---------------------- API PATIENT ----------------------------\\
    router.post('/api/patient-book-appointment', patientController.postBookAppointment)
    router.post('/api/verify-book-appointment', patientController.postVerifyBookAppointment)
    router.get('/api/home-search', patientController.HomeSearch)
    router.get('/api/get-all-patient-appointment', patientController.getAllPatientAppointment)

    //---------------------- API SPECIALTY ----------------------------\\
    router.post('/api/create-new-specialty', specialtyController.createSpecialty)
    router.get('/api/get-all-specialty', specialtyController.getAllSpecialty);
    router.get('/api/get-specialty-by-id', specialtyController.getSpecialtyById);
    router.get('/api/get-detail-specialty-by-id', specialtyController.getDetailSpecialtyById);
    router.post('/api/update-specialty', specialtyController.updateSpecialty)
    router.delete('/api/delete-specialty', specialtyController.deleteSpecialty)

    //---------------------- API CLINIC ----------------------------\\
    router.post('/api/create-new-clinic', clinicController.createdClinic)
    router.get('/api/get-all-clinic', clinicController.getAllClinic)
    router.get('/api/get-detail-clinic-by-id', clinicController.getDetailClinicById)
    router.post('/api/update-clinic-information', clinicController.updateClinicInformation)
    router.delete('/api/clinic-delete', clinicController.clinicDelete)



    return app.use('/', router);
}

module.exports = initWebRouter;