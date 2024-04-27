const sqlite3 = require('sqlite3').verbose();

// Create and open the database
const db = new sqlite3.Database('user_feeds.db');
db.run('CREATE TABLE IF NOT EXISTS feed (username TEXT, status TEXT, datetime TEXT,id TEXT, background TEXT)');


async function getUserFeed(user) {
    return new Promise(async (resolve, reject) => {
        const row = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM feed WHERE username = ?', [user], (err, row) => {
                if (err) {
                    console.error(err);
                    reject(err);
                }
                resolve(row);
            });
        });
        return resolve(row || []);
    })
}

async function addUserFeed(user, data) {
    return new Promise((resolve, reject) => {
        db.run('INSERT INTO feed (username, status, datetime,id,background) VALUES (?, ?, ?, ?, ?)', [user, data.status, data.datetime, data.id, data.background], (err) => {
            if (err) {
                console.error(err);
                reject(err);
            }
            resolve();
        });
    });
}

module.exports = {
    getUserFeed,
    addUserFeed
}