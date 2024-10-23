import dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken';

let verifyToken = (req, res, next) => {
    const token = req.headers.token;
    if (token) {
        const access_token = token.split(' ')[1];
        jwt.verify(access_token, process.env.SECRET_CODE, (err, user) => {
            if (err) {
                console.error('Token verification failed:', err);
                return res.status(403).json({
                    errCode: 1,
                    errMessage: 'Token is not valid'
                });
            }
            req.user = user;
            next();
        })
    } else {
        return res.status(401).json({
            errCode: 2,
            errMessage: "You're not authenticated!"
        });
    }
}


let verifyTokenAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.roleId === 'R1') {
            next();
        } else {
            return res.status(403).json({
                errCode: 1,
                errMessage: `You're not allowed`
            })
        }
    })
}



module.exports = {
    verifyToken: verifyToken,
    verifyTokenAdmin: verifyTokenAdmin
}