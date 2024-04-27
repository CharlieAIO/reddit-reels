const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');
const { storageClient } = require('./helpers/utils')
require('dotenv').config()


const mongo = require('./helpers/mongo');
const middleware = require('./helpers/middleware');
const account_routes = require('./routes/account');
const app_routes = require('./routes/app');
const { stripe_handler } = require('./routes/stripe_handler');
const video_routes = require('./routes/video');
const font_routes = require('./routes/font');
const deleteOldVideos = require('./helpers/auto_video_delete');
const deleteOldVideosDB = require('./helpers/auto_video_delete_db');
const tiktokRefresher = require('./helpers/tiktok_refresher');
const creditHandler = require('./helpers/credit_handler');


const allowedOrigins = ['http://localhost:3000', 'https://app.redditreels.com', 'http://app.redditreels.com']

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"]
    }
});
const port = process.env.PORT || 3000;


app.use(cookieParser());
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            return callback(new Error('CORS policy: No access-control-allow-origin for requested origin.'), false);
        }
        return callback(null, true);
    },
    allowedHeaders: ['Content-Type', 'Authorization', 'Refresh-Token'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));


mongo.initMongo()

// const account_io = io.of('/account')
account_routes(io)

// const app_io = io.of('/app')
middleware(io)
app_routes(io)
video_routes(io)
font_routes(io)

deleteOldVideos()
deleteOldVideosDB()
tiktokRefresher()
creditHandler()

app.post('/webhook', bodyParser.raw({ type: 'application/json' }), stripe_handler);

app.get('/verify', async (req, res) => {
    const code = req.query.code
    const verified = await mongo.verifyAccount(code)
    if (!verified) {
        res.redirect(`https://app.redditreels.com/login?verify=failed&action=verify`)
    } else {
        res.redirect(`https://app.redditreels.com/login?verify=success&action=verify`)
    }
})

app.get('/reset/password', async (req, res) => {
    const code = req.query.code
    res.redirect(`https://app.redditreels.com/login?code=${code}&action=reset-password`)

})

app.get('/videos/:filename', async (req, res) => {
    const filename = req.params.filename;

    try {
        const bucket = storageClient.bucket('reddit-reels-output');
        const file = bucket.file(filename);

        res.setHeader('Content-Type', 'video/mp4'); // Adjust the content type if your videos aren't in mp4 format
        file.createReadStream().pipe(res);
    } catch (error) {
        console.error('Error streaming video:', error.message);
        res.status(500).send('Error streaming video.');
    }
});



const redirect_uri = 'https://app.redditreels.com/tiktok/oauth/callback'
app.get('/tiktok/oauth', (req, res) => {
    const csrfState = Math.random().toString(36).substring(2);
    res.cookie('csrfState', csrfState, { maxAge: 60000 });

    let url = 'https://www.tiktok.com/v2/auth/authorize/';

    // the following params need to be in `application/x-www-form-urlencoded` format.
    url += `?client_key=${process.env.TIKTOK_CLIENT_KEY}`;
    url += '&scope=user.info.basic,video.upload,video.publish';
    url += '&response_type=code';
    url += `&redirect_uri=${redirect_uri}`;
    url += '&state=' + csrfState;

    res.redirect(url);
})



app.get('/tiktok/oauth/callback', async (req, res) => {
    const code = req.query.code
    return res.redirect(`https://app.redditreels.com/?tiktok=${code}`)

})

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});