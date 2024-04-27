const jwt = require('jsonwebtoken');
const { verifyRefresh } = require('./utils')
exports = module.exports = function (io) {
    io.use((socket, next) => {
        const temp_id = `temp_${Math.random().toString(36).substr(2, 9)}`


        const { token, refreshToken } = socket.handshake.auth

        if (token === null && refreshToken === null) {
            return next()
        }

        if (!token || !refreshToken) {
            socket.join(temp_id)
            return io.to(temp_id).emit('logout', { status: 'error', message: 'Couldnt verify token' })
        }

        // Verify the access token
        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (!decoded && !err) {
                socket.join(temp_id)
                return io.to(temp_id).emit('logout', { status: 'error', message: 'Couldnt verify token' })
            }
            if (err && err.name === 'TokenExpiredError') {
                const validReresh = await verifyRefresh(refreshToken)
                if (validReresh) {
                    console.log('Refreshing token')
                    if (!decoded) decoded = jwt.decode(token)
                    const newToken = jwt.sign({ username: decoded.username, verified: decoded.verified }, process.env.JWT_SECRET, { expiresIn: '1h' });
                    io.to(decoded.username).emit('accessTokenRefresh', { token: newToken });

                    socket.username = decoded.username;
                    next();
                } else {
                    socket.join(temp_id)
                    return io.to(temp_id).emit('logout', { status: 'error', message: 'Invalid refresh token' })
                }
            } else if (decoded) {
                if (!decoded.verified) {
                    socket.join(temp_id)
                    return io.to(temp_id).emit('logout', { status: 'error', message: 'Account not verified' })
                }
                socket.username = decoded.username;
                next();
            } else {
                socket.join(temp_id)
                return io.to(temp_id).emit('logout', { status: 'error', message: 'Couldnt verify token' })
            }
        });
    });

}