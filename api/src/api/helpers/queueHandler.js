const async = require('async');
const { createVideo_api } = require('../../app/scripts');
const { updateFeed } = require('./utils');

// Main queue that processes tasks in parallel with a concurrency of 5
const mainQueue = async.queue(async (task) => {
    try {
        console.log(`Processing task for ${task.username}`)
        await createVideo_api(
            task.generateType,
            task.username,
            task.subreddit,
            task.sortBy,
            task.timeFrame,
            task.bgVideo,
            task.minLength || null,
            task.maxLength || null,
            task.subredditType,
            task.manualURL,
            task.captions,
            task.num,
            task.socket
        );
        return null; // Success
    } catch (err) {
        throw err; // Error
    }
}, 5); // Concurrency level

// Map to store user-specific queues
const userQueues = new Map();

// If any of the tasks produce an error in the main queue, you can handle them here
mainQueue.error(async (err, task) => {
    console.error('Task experienced an error:', err);
    await updateFeed(task.socket, 'Error creating video', parseFloat(Date.now()), 'bg-red-500', task.username);
});

// You can also monitor when all the tasks have been processed in the main queue
mainQueue.drain(() => {
    console.log('All tasks have been processed');
});

function getUserQueue(username) {
    if (!userQueues.has(username)) {
        const userQueue = async.queue((task, callback) => {
            // As tasks are processed in the user-specific queue, they're forwarded to the main queue
            mainQueue.push(task, callback);
        }, 1); // Concurrency level for user-specific queue is 1

        userQueues.set(username, userQueue);
    }
    return userQueues.get(username);
}

function addToQueue(data, num, socket) {
    const userQueue = getUserQueue(data.username);
    userQueue.push({ ...data, num: num, socket }, (err) => {
        if (err) {
            console.error('Failed to process task:', err);
        } else {
            console.log('Task completed');
        }
    });
}

module.exports = {
    addToQueue
};
