const async = require('async');
const reddit = require('./reddit');
const { updateFeed } = require('../api/helpers/utils')

const accounts = [
    {
        username: 'Otherwise_Swan_20',
        password: 'Gc696fnXav8ub2w3Lqvh'
    },
    {
        username: 'Timely-Fox-4692',
        password: 'Gc696fnXav8ub2w3Lqvh'
    },
    {
        username: 'WearyImpact7433',
        password: 'Gc696fnXav8ub2w3Lqvh'
    },
    {
        username: 'Used_Ad2880',
        password: 'Gc696fnXav8ub2w3Lqvh'
    }
]
// when adding a new account ensure:
// adult content enabled
// safe browsing disabled
// reduce animation enabled


const BROWSER_COUNT = 2
let browsers = [];

const closeAllBrowsers = async () => {

    for (const browserObj of browsers) {
        if (browserObj?.browser) {
            await browserObj.browser.close();
        }
    }
    browsers = [];
}


const setupBrowsers = async () => {
    await closeAllBrowsers();
    for (let i = 0; i < BROWSER_COUNT; i++) {
        const { page, browser, loggedIn } = await reddit.createBrowser_Login(accounts[i].username, accounts[i].password);
        if (loggedIn) {
            browsers.push({ page, browser, inUse: false });
        } else {
            i--; // If the login failed, retry for this browser instance
        }
    }
}

const getAvailableBrowser = () => {
    for (const browserObj of browsers) {
        if (!browserObj.inUse) {
            browserObj.inUse = true;
            return browserObj;
        }
    }
    return null; // This should not happen as the queue concurrency matches the browser count
}

const releaseBrowser = (browserObj) => {
    browserObj.inUse = false;
}

const queue = async.queue(async (task) => {
    try {
        const browserObj = getAvailableBrowser();
        if (!browserObj) {
            throw new Error('No available browsers')
        }
        if (task.type === "screenshot") {
            await reddit.takeScreenshot(
                browserObj.page,
                task.url,
                task.id,
                task.folder
            );
        } else if (task.type === "comment") {
            await reddit.takeScreenshotComment(
                browserObj.page,
                task.url,
                task.id,
                task.folder
            );
        }
        releaseBrowser(browserObj);
        return null; // Success
    } catch (err) {
        throw err; // Error
    }
}, BROWSER_COUNT);

queue.error(async (err, task) => {
    console.error('Reddit Task experienced an error:', err);
    await updateFeed(task.socket, 'Error getting screenshot', parseFloat(Date.now()), 'bg-red-500', task.username);
});

queue.drain(() => {
    // console.log('All reddit tasks have been processed');
});

function addToQueue(data) {
    queue.push({ ...data }, (err) => {
        if (err) {
            // console.error('Failed to process task:', err);
            return false;
        } else {
            // console.log('Reddit Task completed');
            return true;
        }
    });
}

// Initialize the browsers at the start
setupBrowsers();
setInterval(setupBrowsers, 12 * 60 * 60 * 1000); // Every 12 hours

module.exports = {
    addToQueue
};
