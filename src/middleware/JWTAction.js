import dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken';

const createJWT = () => {
    let payload = { email: 'admin', password: '111111aA' }
    let key = process.env.SECRET_CODE
    let token = null;
    try {
        let token = jwt.sign(payload, key);
    } catch (e) {
        console.log("error token: ", e);
    }
    return token;
}

const veryfyToken = (token) => {
    let key = process.env.SECRET_CODE;
    let data = null;
    try {
        let decoded = jwt.verify(token, key);
        data = decoded;
    } catch (e) {
        console.log('error: ', e);
    }
    return data;
}

module.exports = {
    createJWT,
    veryfyToken,
}