const jwt = require('jsonwebtoken');
const { verifyRefresh } = require('./utils');

module.exports = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const refreshToken = req.headers['refresh-token'];

    if (!authHeader || !refreshToken) {
        return res.status(401).json({ status: 'error', message: 'Couldn\'t verify token' });
    }

    const token = authHeader.split(' ')[1]; // Extract the token from the Bearer

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (!decoded && !err) {
            return res.status(401).json({ status: 'error', message: 'Couldn\'t verify token' });
        }

        if (err && err.name === 'TokenExpiredError') {
            const validRefresh = verifyRefresh(refreshToken);

            if (validRefresh) {
                const newToken = jwt.sign({ user: decoded.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
                res.setHeader('Access-Token', newToken);

                req.username = decoded.username;
                return next();
            } else {
                return res.status(401).json({ status: 'error', message: 'Invalid refresh token' });
            }
        } else if (decoded) {
            req.username = decoded.username;
            return next();
        } else {
            return res.status(401).json({ status: 'error', message: 'Couldn\'t verify token' });
        }
    });
};
