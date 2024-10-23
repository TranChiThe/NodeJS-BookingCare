import express from "express"
import authController from '../controllers/authController';
import userController from "../controllers/userController"
import doctorController from '../controllers/doctorController';
import patientController from '../controllers/patientController'
import specialtyController from '../controllers/specialtyController'
import middlewareController from '../controllers/middlewareController'
import clinicController from '../controllers/clinicController'
import db from '../models/index';
let router = express.Router();

let initWebRouter = (app) => {

    // ------------------------ AUTHENTICATION ------------------------------\\
    router.post('/api/user-register', authController.handleUserRegister);
    router.post('/api/login', authController.handleLogin);
    router.post('/api/refresh-token', authController.refreshToken);
    router.post('/api/logout', middlewareController.verifyToken, authController.logOut);

    // ------------------------ API CHATBOT ------------------------------\\
    // Route để nhận yêu cầu từ Dialogflow
    app.post('/webhook', async (req, res) => {
        const intentName = req.body.queryResult.intent.displayName;
        const doctorName = req.body.queryResult.parameters.doctorName;
        // Xử lý theo intent
        if (intentName === 'webhookTest') {
            try {
                let user = await db.User.findOne({
                    where: { firstName: doctorName.name }
                })
                if (user) {
                    const responseText = `Bác sĩ ${user.firstName} có làm việc trong hệ thống của chúng tôi!`
                    res.json({
                        fulfillmentText: responseText
                    })
                } else {
                    res.json({
                        fulfillmentText: `Không tìm thấy bác sĩ trong hệ thống`
                    })
                }
            }
            catch (error) {
                console.error('Error querying the database:', error);
                res.json({
                    fulfillmentText: 'Đã xảy ra lỗi khi truy vấn cơ sở dữ liệu.',
                });
            }
        } else {
            res.json({
                fulfillmentText: 'Không thể xử lý yêu cầu của bạn.',
            });
        }

    });

    // ------------------------ API USER ------------------------------\\
    router.get('/api/get-all-users', middlewareController.verifyTokenAdmin, userController.handleGetAllUser);
    router.post('/api/create-new-user', userController.handleCreateNewUser);
    router.put('/api/edit-user', userController.handleEditUser);
    router.delete('/api/delete-user', userController.handleDeleteUser);
    router.get('/api/get-allcode', userController.getAllCode);

    //------------------------ API DOCTOR ---------------------------\\
    router.get('/api/get-doctor-home', doctorController.getDoctorHome);
    router.get('/api/get-all-doctor', doctorController.getAllDoctor);
    router.post('/api/save-infor-doctor', doctorController.saveInforDoctor);
    router.get('/api/get-detail-doctor-by-id', doctorController.getDetailDoctorById);
    router.post('/api/bulk-create-schedule', doctorController.bulkCreateSchedule);
    router.get('/api/get-schedule-doctor-by-date', doctorController.getScheduleDoctorByDate);
    router.get('/api/get-extra-info-doctor-by-id', doctorController.getExtraInfoDoctorById);
    router.get('/api/get-profile-doctor-by-id', doctorController.getProfileDoctorById);
    router.get('/api/get-all-doctor-schedule', doctorController.getAllDoctorSchedule);
    router.delete('/api/delete-doctor-schedule', doctorController.deleteDoctorSchedule);
    router.post('/api/doctor-search', doctorController.doctorSearch);


    //---------------------- API PATIENT ----------------------------\\
    router.post('/api/patient-book-appointment', patientController.postBookAppointment)
    router.post('/api/verify-book-appointment', patientController.postVerifyBookAppointment)
    router.post('/api/home-search', patientController.HomeSearch)

    //---------------------- API SPECIALTY ----------------------------\\
    router.post('/api/create-new-specialty', specialtyController.createSpecialty)
    router.get('/api/get-all-specialty', specialtyController.getAllSpecialty);
    router.get('/api/get-specialty-by-id', specialtyController.getSpecialtyById);
    router.get('/api/get-detail-specialty-by-id', specialtyController.getDetailSpecialtyById);

    //---------------------- API CLINIC ----------------------------\\
    router.post('/api/create-new-clinic', clinicController.createdClinic)
    router.get('/api/get-all-clinic', clinicController.getAllClinic)
    router.get('/api/get-detail-clinic-by-id', clinicController.getDetailClinicById)

    return app.use('/', router);
}

module.exports = initWebRouter;