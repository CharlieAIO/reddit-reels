const bcrypt = require('bcrypt');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const os = require('os');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { Webhook } = require('discord-webhook-node');


const { addUserFeed } = require('./db')
const exec = require('child_process').exec;
const { Storage } = require('@google-cloud/storage');

const pathToKey = path.join(__dirname, '../../key.json');
const storageClient = new Storage({
    keyFilename: pathToKey
});
const bucketName = 'reddit-reels-output'
const hook = new Webhook("https://discord.com/api/webhooks/1164935982123069481/D9tSwiYq6Q-KeGsWwn0tznsoquB4HXY3Rn3ixSlXKJaUqzTOqcpOcYADn_itJVbBSAqA");


async function uploadToGCS(localFilePath, GCS_FILENAME) {
    try {
        const bucket = storageClient.bucket(bucketName);
        await bucket.upload(localFilePath, {
            destination: GCS_FILENAME,
        });

        return `gs://${bucketName}/${GCS_FILENAME}`;
    } catch (error) {
        console.error('Error uploading file:', error.message);
        throw error;
    }
}



async function fileExistsInGCS(filename) {
    try {
        const bucket = storageClient.bucket(bucketName);
        const file = bucket.file(filename);
        const exists = await file.exists();
        return exists[0]; // exists is an array where the first element is a boolean
    } catch (error) {
        console.error('Error checking file existence:', error.message);
        throw error;
    }
}

async function getFileForDownload(filename) {
    try {
        const bucket = storageClient.bucket(bucketName);
        const file = bucket.file(filename);
        const [fileExists] = await file.exists();
        if (!fileExists) {
            return null
        }
        return file;
    } catch (error) {
        console.error('Error getting file for download:', error.message);

    }
    return null
}


async function hashPassword(password) {
    const saltRounds = 10;

    const hashedPassword = await new Promise((resolve, reject) => {
        bcrypt.hash(password, saltRounds, function (err, hash) {
            if (err) reject(err);
            resolve(hash);
        });
    });

    return hashedPassword;
}

async function comparePassword(password, hashedPassword) {
    const match = await new Promise((resolve, reject) => {
        bcrypt.compare(password, hashedPassword, function (err, result) {
            if (err) reject(err);
            resolve(result);
        });
    });

    return match;
}


async function signAccessToken(username, verified = true) {
    return new Promise((resolve, reject) => {
        jwt.sign({ username, verified }, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
            if (err) reject(err);
            resolve(token);
        });
    });
}

async function signRefreshToken(username, verified = true) {
    return new Promise((resolve, reject) => {
        jwt.sign({ username, verified }, process.env.JWT_REFRESH_SECRET, { expiresIn: '365d' }, (err, token) => {
            if (err) reject(err);
            resolve(token);
        });
    });
}

async function verifyRefresh(token) {
    return new Promise((resolve) => {
        jwt.verify(token, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
            if (err) resolve(false)
            else {
                resolve(true)
            }
        })
    })
}



async function updateFontsFile(fontFamily, destination) {
    const fontsConfPath = path.join(__dirname, '../../fonts.conf');
    const existingContent = await fs.promises.readFile(fontsConfPath, 'utf-8');

    // Check if the font path already exists in the file, and skip the update if it does
    if (existingContent.includes(destination)) {
        return;
    }

    const newContent = `
<dir>fonts/${destination}</dir>
<alias>
  <family>${fontFamily}</family>
  <prefer>
    <family>${fontFamily}</family>
  </prefer>
</alias>
`;

    // Insert the new content just before the closing </fontconfig> tag
    const updatedContent = existingContent.replace('</fontconfig>', `${newContent}</fontconfig>`);

    // Write the updated content back to the fonts.conf file
    await fs.promises.writeFile(fontsConfPath, updatedContent);

}



function formatTime(seconds) {
    seconds = parseFloat(seconds)
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
}


async function updateFeed(io, msg, datenow, bg, username) {
    const feedData = {
        background: bg,
        status: msg,
        datetime: datenow,
        id: `${datenow}-${Math.floor(Math.random() * 1000)}`
    }
    await addUserFeed(username, feedData)
    io.to(username).emit('update-feed', {
        type: 'single',
        feed: feedData
    })
}

async function installFont(fontPath) {
    return new Promise((resolve, reject) => {
        var installCommand = ''
        var scriptPath = ''

        switch (os.platform()) {
            case 'linux':
                scriptPath = path.join(__dirname, '../../scripts/font-linux.sh')
                installCommand = `sudo ${scriptPath} ${fontPath}`;
                break;
            case 'darwin':
                scriptPath = path.join(__dirname, '../../scripts/font-darwin.sh')
                installCommand = `${scriptPath} ${fontPath}`;
                break;
            case 'win32':
                scriptPath = path.join(__dirname, '../../scripts/font-win.ps1')
                installCommand = `powershell.exe -File ${scriptPath} -fontPath "${fontPath}"`;
                break;
            default:
                return reject('Unsupported platform')
        }


        exec(installCommand, (error) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return reject(error)
            }
            return resolve(true)
        });
    })


}

function getFontName(fileName) {
    return new Promise((resolve, reject) => {
        switch (process.platform) {
            case 'win32':
                // Windows - PowerShell command to find font name by file name
                exec(`(New-Object System.Drawing.Text.PrivateFontCollection).AddFontFile("${fileName}"); (New-Object System.Drawing.Text.PrivateFontCollection).Families.Name`, (err, stdout) => {
                    if (err) reject(err);
                    else resolve(stdout ? stdout.trim() : null);
                });
                break;
            case 'darwin':
                exec(`fc-list | grep "${fileName}"`, (err, stdout) => {
                    if (err) reject(err);
                    else {
                        const _ = stdout.split(':style=')[0].split(':')[1].trim()
                        const commaSplit = _.split(',')
                        const font = commaSplit[commaSplit.length - 1]
                        return resolve(font)
                    }
                });
                break;
            case 'linux':
                // macOS and Linux - Use fc-list and grep to find font name by file name
                exec(`fc-list "${fileName}"`, (err, stdout) => {
                    if (err) reject(err);
                    else {
                        const _ = stdout.split(':style=')[0].split(':')[1].trim()
                        const commaSplit = _.split(',')
                        const font = commaSplit[commaSplit.length - 1]
                        return resolve(font)
                    }
                });
                break;
            default:
                reject(new Error('Unsupported platform'));
        }
    });
}

async function sendVerificationEmail(email, code) {
    const transporter = nodemailer.createTransport({
        host: 'mail.privateemail.com',
        port: 587, // You can also use 465 for SSL
        secure: false, // true for port 465, false for port 587
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    // Read the HTML content from the file
    const htmlTemplate = fs.readFileSync(path.join(__dirname, '../templates/verify_template.html'), 'utf8');

    // Replace the placeholder with the actual code
    const htmlContent = htmlTemplate.replace('{{CODE}}', code);

    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'RedditReels Verification',
        html: htmlContent
    };


    try {
        const send = await transporter.sendMail(mailOptions);
        // console.log('Email sent:', send);
        return true
    } catch (error) {
        console.error('Error sending email:', error);
        return false
    }
}

async function sendResetEmail(email, code) {
    const transporter = nodemailer.createTransport({
        host: 'mail.privateemail.com',
        port: 587, // You can also use 465 for SSL
        secure: false, // true for port 465, false for port 587
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    // Read the HTML content from the file
    const htmlTemplate = fs.readFileSync(path.join(__dirname, '../templates/reset_template.html'), 'utf8');

    // Replace the placeholder with the actual code
    const htmlContent = htmlTemplate.replace('{{CODE}}', code);

    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'RedditReels Password Reset',
        html: htmlContent
    };


    try {
        const send = await transporter.sendMail(mailOptions);
        // console.log('Email sent:', send);
        return true
    } catch (error) {
        console.error('Error sending email:', error);
        return false
    }
}

const refreshTikTokAccess = async (refresh_token) => {

    try {
        const response = await axios.post('https://open.tiktokapis.com/v2/oauth/token/', {
            client_key: process.env.TIKTOK_CLIENT_KEY,
            client_secret: process.env.TIKTOK_CLIENT_SECRET,
            grant_type: 'refresh_token',
            refresh_token: refresh_token
        }, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cache-Control': 'no-cache'
            }
        });
        if (response.status === 200) {
            if (response.data.error) {
                return null
            } else {
                return response.data
            }
        }
    } catch (error) {
        return null;
    }
};


const authTiktokCode = async (code) => {
    const redirect_uri = 'https://app.redditreels.com/tiktok/oauth/callback'

    try {
        const response = await axios.post('https://open.tiktokapis.com/v2/oauth/token/', {
            client_key: process.env.TIKTOK_CLIENT_KEY,
            client_secret: process.env.TIKTOK_CLIENT_SECRET,
            code,
            grant_type: 'authorization_code',
            redirect_uri: redirect_uri
        }, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cache-Control': 'no-cache'
            }
        });
        return response.data;
    } catch (error) {
        return null;
    }
};


const uploadVideoToTikTok = async (accessToken, filename) => {
    try {
        // Generate a publicly accessible URL for the video in GCP
        // const videoURL = `https://storage.googleapis.com/${bucketName}/${filename}`
        const videoURL = `https://app.redditreels.com/videos/${filename}`

        if (!videoURL) {
            console.error('Could not generate a public URL for the video.');
            return;
        }

        const videoMetadata = {
            source_info: {
                source: 'PULL_FROM_URL',
                video_url: videoURL
            },

        };


        const response = await axios.post('https://open.tiktokapis.com/v2/post/publish/inbox/video/init/', videoMetadata, {
            headers: {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'application/json; charset=UTF-8'
            }
        });

        if (response.status !== 200) {
            return false
        }
        return true;

    } catch (error) {
        console.error('Error uploading video:', error.response ? error.response.data : error.message);
        return false
    }
};


const newSignupEmbed = async (username, email) => {
    try {
        const embed = new MessageBuilder()
            .setTitle('New Signup from RedditReels')
            .setAuthor('Reddit Reels', 'https://i.imgur.com/qCpPsx7.png')
            .setColor('#ea580b')
            .setDescription(`New signup from **${username}** (${email})`)

            .setTimestamp();

        hook.send(embed);
    } catch { }
}

module.exports = {
    hashPassword,
    comparePassword,
    signAccessToken,
    signRefreshToken,
    verifyRefresh,
    updateFontsFile,
    formatTime,
    updateFeed,
    installFont,
    getFontName,
    uploadToGCS,
    fileExistsInGCS,
    getFileForDownload,
    sendVerificationEmail,
    sendResetEmail,
    authTiktokCode,
    uploadVideoToTikTok,
    refreshTikTokAccess,
    storageClient,
    newSignupEmbed
}