const { getUserFeed } = require('../helpers/db');
const { getAccount, updateSubtitleColor, setVoice, setTikTok, lookupVideo } = require('../helpers/mongo');
const { addToQueue } = require('../helpers/queueHandler');
const { formatTime, updateFeed, authTiktokCode, uploadVideoToTikTok } = require('../helpers/utils');
const { createOneTimePayment, getBalance } = require('../helpers/stripe')


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

        socket.on('generate-video', async (data, callback) => {
            isUserInRoom(socket.id, socket.username) ? null : socket.join(socket.username);

            const balance = await getBalance(socket.username)
            const balanceAfterDeduction = balance - 30
            if (balanceAfterDeduction < 0) {
                await updateFeed(io, `Not enough credit to generate`, parseFloat(Date.now()), 'bg-red-500', socket.username)
                return callback({ status: 'failed', message: 'Not enough credit to generate' })
            }


            // make sure all the required fields are present
            if (data.subredditType === "Auto") {
                if (!data.generateType || !data.subreddit || !data.bgVideo || !data.sortBy || !data.timeFrame) {
                    return callback({ status: 'failed', message: 'Missing required fields' })
                }
            } else {
                if (!data.generateType || !data.bgVideo || !data.manualURL) {
                    return callback({ status: 'failed', message: 'Missing required fields' })
                }
            }


            const count = 1
            await updateFeed(io, `Generating ${data.generateType} video (${data.subredditType === "Auto" ? data.subreddit : "Manual URL"})`, parseFloat(Date.now()), 'bg-gray-500', socket.username)


            addToQueue({ ...data, username: socket.username }, count, io)
            return callback({ status: 'success' })



        });

        socket.on('feed', async () => {
            isUserInRoom(socket.id, socket.username) ? null : socket.join(socket.username);

            var userFeed = await getUserFeed(socket.username)
            io.to(socket.username).emit('update-feed', { type: 'all', feed: userFeed })
        })


        socket.on('config', async () => {
            isUserInRoom(socket.id, socket.username) ? null : socket.join(socket.username);

            const account = await getAccount(socket.username)

            io.to(socket.username).emit('config', {
                font: account.font ? account.font : null,
                videos: account.videos ? account.videos : [],
                subtitleColor: account.subtitleColor ? account.subtitleColor : '#ffffff',
                tiktokConnected: account.tiktok ? (account.tiktok.error ? false : true) : false,
                voice: account.voice ? account.voice : {
                    name: 'en-US-Standard-A',
                    languageCode: 'en-US',
                },
            })
        })

        socket.on('update-subtitle-color', async (data) => {
            isUserInRoom(socket.id, socket.username) ? null : socket.join(socket.username);


            const response = await updateSubtitleColor(data, socket.username)
            if (response) {
                await updateFeed(io, 'Updated Subtitle color', parseFloat(Date.now()), 'bg-green-500', socket.username)
            }
        })

        socket.on('update-voice', async (voice_) => {
            isUserInRoom(socket.id, socket.username) ? null : socket.join(socket.username);

            if (!voice_?.name || !voice_?.languageCode) return

            const response = await setVoice(voice_, socket.username)
            if (!response) {
                await updateFeed(io, 'Error updating voice', parseFloat(Date.now()), 'bg-red-500', socket.username)
            } else {
                await updateFeed(io, `Updated voice (${voice_.name})`, parseFloat(Date.now()), 'bg-green-500', socket.username)
            }

        })

        socket.on('completed-videos', async () => {
            isUserInRoom(socket.id, socket.username) ? null : socket.join(socket.username);

            const account = await getAccount(socket.username)
            io.to(socket.username).emit('completed-videos', account?.outputVideos ? account.outputVideos.filter((e) => !e.deleted) : [])
        })

        socket.on('stats', async () => {
            isUserInRoom(socket.id, socket.username) ? null : socket.join(socket.username);

            const account = await getAccount(socket.username);
            const outputVideos = account.outputVideos || [];

            const timeFrames = {
                today: { videos: [], subreddits: {}, videoLength: 0 },
                last7Days: { videos: [], subreddits: {}, videoLength: 0 },
                last30Days: { videos: [], subreddits: {}, videoLength: 0 },
                allTime: { videos: [], subreddits: {}, videoLength: 0 }
            };



            const todayDate = new Date();
            // todayDate.setHours(0, 0, 0, 0); // Reset time component

            const last7DaysDate = new Date();
            last7DaysDate.setDate(last7DaysDate.getDate() - 7);
            last7DaysDate.setHours(0, 0, 0, 0); // Reset time component

            const last30DaysDate = new Date();
            last30DaysDate.setDate(last30DaysDate.getDate() - 30);
            last30DaysDate.setHours(0, 0, 0, 0); // Reset time component

            outputVideos.forEach(video => {
                const date = new Date(video.timestamp); // Convert from seconds to milliseconds
                date.setHours(0, 0, 0, 0); // Reset time component

                // Add to all-time videos
                timeFrames.allTime.videos.push(video);
                timeFrames.allTime.videoLength += parseFloat(video.videoLength);
                timeFrames.allTime.subreddits[video.subreddit] = (timeFrames.allTime.subreddits[video.subreddit] || 0) + 1;

                // Check for last 30 days (including today)
                if (date >= last30DaysDate) {
                    timeFrames.last30Days.videos.push(video);
                    timeFrames.last30Days.videoLength += parseFloat(video.videoLength)
                    timeFrames.last30Days.subreddits[video.subreddit] = (timeFrames.last30Days.subreddits[video.subreddit] || 0) + 1;
                }

                // Check for last 7 days (including today)
                if (date >= last7DaysDate) {
                    timeFrames.last7Days.videos.push(video);
                    timeFrames.last7Days.videoLength += parseFloat(video.videoLength);
                    timeFrames.last7Days.subreddits[video.subreddit] = (timeFrames.last7Days.subreddits[video.subreddit] || 0) + 1;
                }



                // Check for today
                if (date.getDate() === todayDate.getDate() && date.getMonth() === todayDate.getMonth() && date.getFullYear() === todayDate.getFullYear()) {
                    timeFrames.today.videos.push(video);
                    timeFrames.today.videoLength += parseFloat(video.videoLength);
                    timeFrames.today.subreddits[video.subreddit] = (timeFrames.today.subreddits[video.subreddit] || 0) + 1;
                }
            });

            const stats = {};

            for (const [key, frame] of Object.entries(timeFrames)) {
                const mostCommonSubreddit = Object.entries(frame.subreddits).reduce((prev, [sub, count]) => count > prev.count ? { sub, count } : prev, { sub: '', count: 0 }).sub;
                stats[key] = {
                    totalVideosMade: {
                        name: 'Total videos made',
                        stat: frame.videos.length
                    },
                    averageVideoLength: {
                        name: 'Average video length',
                        stat: formatTime(frame?.videoLength / frame?.videos?.length || 0) || '0m 0s'
                    },
                    mostCommonSubreddit: {
                        name: 'Most common subreddit',
                        stat: 'r/' + mostCommonSubreddit
                    }
                };
            }


            io.to(socket.username).emit('stats', stats);
        });


        socket.on('add-credit', async (data) => {
            isUserInRoom(socket.id, socket.username) ? null : socket.join(socket.username);

            const res = await createOneTimePayment(socket.username, data.amount * 100, data.currency)

            io.to(socket.username).emit('add-credit', res)
        })

        socket.on('credit-balance', async () => {
            isUserInRoom(socket.id, socket.username) ? null : socket.join(socket.username);

            const balance = await getBalance(socket.username)

            io.to(socket.username).emit('credit-balance', balance)
        })

        socket.on('connect-tiktok', async (data) => {
            isUserInRoom(socket.id, socket.username) ? null : socket.join(socket.username);


            const auth = await authTiktokCode(data.code)


            if (!auth) {
                io.to(socket.username).emit('connect-tiktok', { status: 'failed' })
            } else {
                const res = await setTikTok(auth, socket.username)
                io.to(socket.username).emit('connect-tiktok', { status: 'success' })
            }
        })

        socket.on('tiktok-upload', async (fileParam) => {
            isUserInRoom(socket.id, socket.username) ? null : socket.join(socket.username);

            try {
                // Look up the video file in MongoDB
                const filePath = await lookupVideo(fileParam, socket.username);
                if (!filePath) {
                    io.to(socket.username).emit('tiktok-upload', { status: 'error', message: 'Video file not found.' });
                    return;
                }

                const user = await getAccount(socket.username)
                if (!user.tiktok) {
                    io.to(socket.username).emit('tiktok-upload', { status: 'error', message: 'Tiktok account not found.' });
                    return;
                }

                const res = await uploadVideoToTikTok(user.tiktok?.access_token, fileParam)
                if (res) {
                    io.to(socket.username).emit('tiktok-upload', { status: 'success', message: null });
                    return;
                } else {
                    io.to(socket.username).emit('tiktok-upload', { status: 'error', message: 'Upload failed' });
                    return;
                }

            } catch (error) {
                console.log(error)
                io.to(socket.username).emit('tiktok-upload', { status: 'error', message: 'An error occurred while trying to upload to tiktok.' });
            }
        })

    });

}