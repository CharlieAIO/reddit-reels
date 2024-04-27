const fs = require('fs');
const path = require('path');
const mongo = require('../helpers/mongo');
const { updateFeed, getFileForDownload } = require('../helpers/utils');
const { cropToTikTokPortrait } = require('../../app/cropVideos')


const CHUNK_SIZE = 1024 * 100; // 100KB

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

        socket.on('download-video', async (fileParam) => {
            // Check if the user is in the room
            isUserInRoom(socket.id, socket.username) ? null : socket.join(socket.username);

            try {
                // Look up the video file in MongoDB
                const filePath = await mongo.lookupVideo(fileParam, socket.username);
                if (!filePath) {
                    io.to(socket.username).emit('download-response', { status: 'error', message: 'Video file not found.' });
                    return;
                }

                // Get the file from Google Cloud Storage
                const file = await getFileForDownload(fileParam);
                if (!file) {
                    io.to(socket.username).emit('download-response', { status: 'error', message: 'Video file not found in storage.' });
                    return;
                }

                // Create a read stream for the file
                const stream = file.createReadStream({ highWaterMark: CHUNK_SIZE });

                // Get the total size of the file for percentage calculations.
                const [metadata] = await file.getMetadata();
                const totalSize = metadata.size;


                stream.on('data', (chunk) => {
                    const base64Chunk = chunk.toString('base64');

                    // Emit the chunk and total size to the client
                    io.to(socket.username).emit('download-response', {
                        status: 'downloading',
                        data: base64Chunk,
                        totalSize: totalSize,
                        filename: fileParam
                    });
                });

                stream.on('end', () => {
                    // Notify the client that the download is complete
                    io.to(socket.username).emit('download-response', { status: 'complete' });
                });

                stream.on('error', (err) => {
                    // Handle errors
                    console.error(err);
                    io.to(socket.username).emit('download-response', { status: 'error', message: err.message });
                });

            } catch (error) {
                console.error(error);
                io.to(socket.username).emit('download-response', { status: 'error', message: 'An error occurred while retrieving the video file.' });
            }
        });
        socket.on('delete-video', async (fileName, callback) => {
            isUserInRoom(socket.id, socket.username) ? null : socket.join(socket.username);


            try {
                const delPath = await mongo.lookupBGVideo(fileName, socket.username)
                const finalDelPath = path.join(__dirname, '../../../videos/', delPath)
                fs.promises.unlink(finalDelPath).catch(err => { })

                // Delete the video information from the database
                await mongo.delBGVideo(fileName, socket.username);
                await updateFeed(io, 'Deleted a background video', parseFloat(Date.now()), 'bg-red-500', socket.username);
                return callback({ status: 'success' });
            } catch (e) {
                return callback({ status: 'failed' })
            }
        })

        socket.on('start-upload', (filename) => {
            writeStreams[socket.username] = fs.createWriteStream(path.join(__dirname, '../../../videos/', filename));
        });

        socket.on('upload-chunk', (data, callback) => {
            if (writeStreams[socket.username]) {
                writeStreams[socket.username].write(data);
                callback({ status: 'success' })
            }
        });

        socket.on('end-upload', async (data, callback) => {
            isUserInRoom(socket.id, socket.username) ? null : socket.join(socket.username);

            if (writeStreams[socket.username]) {
                writeStreams[socket.username].end();
                if (fs.existsSync(path.join(__dirname, '../../../videos/', data.filePath))) {
                    try {
                        delete writeStreams[socket.username];
                        await mongo.addBGVideo({ fileName: data.fileName, filePath: data.filePath }, socket.username);
                        await updateFeed(io, 'Uploaded a new background video', parseFloat(Date.now()), 'bg-green-500', socket.username);
                        if (data.crop) {
                            await updateFeed(io, 'Cropping video...', parseFloat(Date.now()), 'bg-gray-500', socket.username);


                            const inputPath = path.join(__dirname, `../../../videos/${data.filePath}`);
                            const inputPathTEMP = path.join(__dirname, `../../../videos/temp_${data.filePath}`);
                            await cropToTikTokPortrait(inputPath, inputPathTEMP);
                            fs.unlinkSync(inputPathTEMP);

                            await updateFeed(io, 'Video cropped', parseFloat(Date.now()), 'bg-green-500', socket.username);
                        }

                        return callback({ status: 'success' });
                    } catch { return callback({ status: 'failed' }) }
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