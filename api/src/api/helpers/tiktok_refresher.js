const axios = require('axios');

const { setTikTok, getCollection } = require('./mongo');
const { refreshTikTokAccess } = require('./utils');

async function checkUserAccessTokens() {
    try {
        let users = await getCollection('accounts');
        users = await users.find({}).toArray();
        for (let user of users) {
            if (!user.tiktok) continue;
            // Assuming each user has an access token that you want to check
            const refreshToken = user.tiktok.refresh_token ? user.tiktok.refresh_token : null
            if (!refreshToken) continue


            // You can call a function to check or refresh the token here.
            // For simplicity, I'm just calling a placeholder function.
            const refreshed = await refreshTikTokAccess(refreshToken);
            if (refreshed) {
                await setTikTok(refreshed, user.username);
            } else {
                await setTikTok({ error: true }, user.username);
            }
        }
    } catch (error) {
        console.error('Error checking user access tokens:', error);
    }
}

function startBackgroundTask() {
    checkUserAccessTokens(); // Call immediately
    return setInterval(checkUserAccessTokens, 10 * 60 * 1000); // Return the interval ID
}

module.exports = startBackgroundTask;
