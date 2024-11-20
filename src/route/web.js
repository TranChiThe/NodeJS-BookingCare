import express from "express"
import authController from '../controllers/authController';
import userController from "../controllers/userController"
import doctorController from '../controllers/doctorController';
import patientController from '../controllers/patientController'
import specialtyController from '../controllers/specialtyController'
import middlewareController from '../controllers/middlewareController'
import clinicController from '../controllers/clinicController'
import adminController from '../controllers/adminController'
import chatbotController from '../controllers/chatbotController'
let router = express.Router();
let initWebRouter = (app) => {

    // ------------------------ AUTHENTICATION ------------------------------\\
    router.post('/api/user-register', authController.handleUserRegister);
    router.post('/api/login', authController.handleLogin);
    router.post('/api/refresh-token', authController.refreshToken);
    router.post('/api/logout', middlewareController.verifyToken, authController.logOut);

    // ------------------------ API CHATBOT ------------------------------\\
    router.post('/webhook', chatbotController.handleSendMessage)

    // ------------------------ API ADMIN ------------------------------\\
    router.get('/api/get-appointment-by-time', adminController.getAppointmentByTime)
    router.get('/api/get-count-patient-by-time', adminController.getCountPatientByTime)
    router.get('/api/get-dashboard-info', adminController.getDashBoardInfo)
    router.get('/api/get-system-code', adminController.getSystemCode)
    router.post('/api/add-system-code', adminController.addSystemCode)
    router.post('/api/edit-system-code', adminController.editSystemCode)
    router.delete('/api/delete-system-code', adminController.deleteSystemCode)


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
    router.get('/api/get-doctor-comment', doctorController.getDoctorComment);
    router.get('/api/get-all-doctor-comment-by-date', doctorController.getAllDoctorCommentByDate);
    router.delete('/api/delete-doctor-comment', doctorController.deleteDoctorComment);

    //---------------------- API PATIENT ----------------------------\\
    router.post('/api/patient-book-appointment', patientController.postBookAppointment)
    router.post('/api/verify-book-appointment', patientController.postVerifyBookAppointment)
    router.get('/api/home-search', patientController.HomeSearch)
    router.get('/api/get-all-patient-appointment', patientController.getAllPatientAppointment)
    router.post('/api/post-comment', patientController.handlePostComment)


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