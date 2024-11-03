require('dotenv').config();
import { result } from 'lodash';
import nodemailer from 'nodemailer';

let sendSimpleEmail = async (dataSend) => {
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // Use `true` for port 465, `false` for all other ports
        auth: {
            user: process.env.EMAIL_APP,
            pass: process.env.EMAIL_APP_PASSWORD,
        },
    });

    // async..await is not allowed in global scope, must use a wrapper
    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: '"HealthCareCanTho 👻" <healthcarecantho@gmail.com>', // sender address
        to: dataSend.receiverEmail, // list of receivers
        subject: "Thông tin đặt lịch khám bệnh ✔", // Subject line
        html: getBodyHTMLEmail(dataSend)
    });
}

let getBodyHTMLEmail = (dataSend) => {
    let result = ''
    if (dataSend.language === 'vi') {
        result =
            `
        <h3> Xin chào ${dataSend.patientName}!</h3>
        <p> Bạn nhận được email này vì đã đặt lịch khám bệnh online trên hệ thống healthcarre của chúng tôi.</p>
        <p> Thông tin đặt lịch khám bệnh: </p>
        <div><b> Mã hồ sơ: ${dataSend.recordId}</b></div>
        <div><b> Thời gian: ${dataSend.time}</b></div>
        <div><b> Bác sĩ: ${dataSend.doctorName}</b></div>
        <p>Nếu các thôn tin trên là đúng sự thật, vui lòng click vào link bên dưới để xác nhận và hoàn tất thủ tục đặt lịch khám bệnh của bạn</p>
        <div>
            <a href=${dataSend.redirectLink} target = "_blank">Click here</a>
        </div>
        <div>Xin chân thành cảm ơn!</div>
    `
    }
    if (dataSend.language === 'en') {
        result =
            ` 
            <h3> Dear, ${dataSend.patientName}!</h3>
            <p> You received this email because you made an online medical appointment on our healthcarre system.</p>
            <p> Information for scheduling medical examination: </p>
            <div><b> Record code: ${dataSend.recordId}</b></div>
            <div><b> Time: ${dataSend.time}</b></div>
            <div><b> Doctor: ${dataSend.doctorName}</b></div>
            <p>If the above information is true, please click on the link below  to confirm and complete your medical appointment booking procedure.</p>
            <div>
                <a href=${dataSend.redirectLink} target = "_blank">Click here</a>
            </div>
            <div>Sincerely thank!</div>
        `
    }
    return result;
}


module.exports = {
    sendSimpleEmail: sendSimpleEmail,
    getBodyHTMLEmail: getBodyHTMLEmail
}