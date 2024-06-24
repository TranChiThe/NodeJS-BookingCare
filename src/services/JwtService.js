import jwt from 'jsonwebtoken'
import { Model } from 'sequelize';

export const generalAccessToken = (payload) => {
    console.log('payload', payload);
    let access_token = jwt.sign({
        payload
    }, 'access_token', { expiresIn: '1h' });
    return access_token;
}

module.exports = {
    generalAccessToken
}