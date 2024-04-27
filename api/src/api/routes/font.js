const fs = require('fs');
const path = require('path');
const mongo = require('../helpers/mongo');
const { updateFeed, installFont, getFontName } = require('../helpers/utils');

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
        let writeStreams = {};

        socket.on('start-upload-font', (filename) => {
            writeStreams[socket.username] = fs.createWriteStream(path.join(__dirname, '../../../fonts/', filename));
        });

        socket.on('upload-chunk-font', (data, callback) => {
            if (writeStreams[socket.username]) {
                writeStreams[socket.username].write(data);
                callback()
            }
        });

        socket.on('end-upload-font', async (data, callback) => {
            isUserInRoom(socket.id, socket.username) ? null : socket.join(socket.username);

            if (writeStreams[socket.username]) {
                writeStreams[socket.username].end();
                if (fs.existsSync(path.join(__dirname, '../../../fonts/', data.filePath))) {
                    try {
                        delete writeStreams[socket.username];

                        const fontFamily = data.fileName.split('.')[0];
                        await installFont(path.join(__dirname, '../../../fonts/', data.filePath))
                        const fontName = await getFontName(fontFamily)
                        await mongo.saveFont(fontName, socket.username);
                        fs.promises.unlink(path.join(__dirname, '../../../fonts/', data.filePath));

                        await updateFeed(io, (`Uploaded a new font (${fontName})`), parseFloat(Date.now()), 'bg-green-500', socket.username);
                        return callback({ status: 'success' });
                    } catch (e) {
                        console.log(e)
                        return callback({ status: 'failed' });
                    }
                }
                return callback({ status: 'failed' });

            }
        });

        writeStreams[socket.username]?.on('error', (err) => {
            console.error('Error writing file:', err);
            // Potentially notify the client about the error.
        });

        socket.on('disconnect', () => {
            if (writeStreams[socket.username]) {
                writeStreams[socket.username].end();
                delete writeStreams[socket.username];
            }
        });

    })
}