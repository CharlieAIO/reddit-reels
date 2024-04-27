const mongo = require('../helpers/mongo');
const { comparePassword, hashPassword, signAccessToken, signRefreshToken, sendVerificationEmail, sendResetEmail, newSignupEmbed } = require('../helpers/utils');




exports = module.exports = function (io) {
    function isUserInRoom(userId, roomName) {
        let room = io.sockets.adapter.rooms.get(roomName);
        if (!room) return false;

        for (let id of room) {
            if (id === userId) {
                return true;
            }
        }
        return false;
    }

    io.on('connection', (socket) => {



        socket.on('login', async (data) => {
            const temp_id = `temp_${Math.random().toString(36).substr(2, 9)}`
            socket.join(temp_id)

            if (!data.username_email || !data.password) return io.to(temp_id).emit('login', { status: 'error', message: 'Missing fields' })

            const account = await mongo.getAccount(data.username_email)
            if (!account) return io.to(temp_id).emit('login', { status: 'error', message: 'Account not found' });

            const passwordMATCH = await comparePassword(data.password, account.password)
            if (!passwordMATCH) return io.to(temp_id).emit('login', { status: 'error', message: 'Incorrect password' });


            const accessToken = await signAccessToken(account.username, account.verified)
            const refreshToken = await signRefreshToken(account.username, account.verified)
            isUserInRoom(socket.id, account.username) ? null : socket.join(account.username);

            io.to(account.username).emit('login', { status: 'success', accessToken, refreshToken, verified: account.verified })
        })

        socket.on('signup', async (data) => {
            const temp_id = `temp_${Math.random().toString(36).substr(2, 9)}`
            socket.join(temp_id)


            if (!data.username || !data.email || !data.password) return io.to(temp_id).emit('signup', { status: 'error', message: 'Missing fields' })

            // generate a random 20 character string

            const verificationCode = [...Array(30)].map(() => Math.random().toString(36)[2]).join('')
            const account = await mongo.addAccount({
                username: data.username,
                email: data.email,
                password: await hashPassword(data.password),
                verified: false,
                verificationCode,
                createdAt: parseFloat(Date.now()),
            })
            if (!account) return io.to(temp_id).emit('signup', { status: 'error', message: 'Account already exists' });

            await sendVerificationEmail(data.email, verificationCode)

            await newSignupEmbed(data.username, data.email)

            io.to(temp_id).emit('signup', { status: 'success', message: 'Please verify your email' })
            socket.leave(temp_id)
        })

        socket.on('reset-password-request', async (username_email) => {
            const temp_id = `temp_${Math.random().toString(36).substr(2, 9)}`
            socket.join(temp_id)

            const verificationCode = [...Array(30)].map(() => Math.random().toString(36)[2]).join('')
            const account = await mongo.getAccount(username_email)
            if (!account) return io.to(temp_id).emit('reset-password-request', { status: 'error', message: 'Account not found' });

            const res = await mongo.setResetPasswordCode(account.email, verificationCode)
            if (!res) return io.to(temp_id).emit('reset-password-request', { status: 'error', message: 'Account not found' });

            await sendResetEmail(account.email, verificationCode)
            io.to(temp_id).emit('reset-password-request', { status: 'success', message: 'Please check your email' })
            socket.leave(temp_id)
        })


        socket.on('reset-password', async (data) => {
            const temp_id = `temp_${Math.random().toString(36).substr(2, 9)}`
            socket.join(temp_id)

            if (!data.password || !data.code) return io.to(temp_id).emit('reset-password', { status: 'error', message: 'Missing fields' })

            const hashedPSWD = await hashPassword(data.password)
            const res = await mongo.resetPassword(data.code, hashedPSWD)
            if (!res) return io.to(temp_id).emit('reset-password', { status: 'error', message: 'Account not found' });

            io.to(temp_id).emit('reset-password', { status: 'success', message: 'Password reset' })
            socket.leave(temp_id)
        })


        socket.on('verify-resend', async (username_email) => {
            const temp_id = `temp_${Math.random().toString(36).substr(2, 9)}`
            socket.join(temp_id)
            const account = await mongo.getAccount(username_email)

            if (!account?.email) return io.to(temp_id).emit('verify-resend', { status: 'error', message: 'Missing fields' })

            const verificationCode = [...Array(30)].map(() => Math.random().toString(36)[2]).join('')
            const res = await mongo.updateVerificationCode(account?.email, verificationCode)
            if (!res) return io.to(temp_id).emit('verify-resend', { status: 'error', message: 'Account not found' });

            await sendVerificationEmail(account?.email, verificationCode)
            io.to(temp_id).emit('verify-resend', { status: 'success', message: 'Please check your email' })
            socket.leave(temp_id)
        })


    });

}