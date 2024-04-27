const { delOutputVideo, getCollection } = require('./mongo')

// Function to delete old videos from db
const deleteOldVideosDB = async () => {
    try {
        var accountsCursor = await getCollection('accounts');
        const accounts = await accountsCursor.find({}).toArray();

        for (const account of accounts) {
            const outputVideos = account.outputVideos || []
            const currentTime = new Date();
            for (var i = 0; i < outputVideos.length; i++) {
                const timeCreated = new Date(outputVideos[i].timestamp);
                const ageInDays = (currentTime - timeCreated) / (1000 * 60 * 60 * 24);

                if (ageInDays > 7) {
                    await delOutputVideo(account.username, outputVideos[i].id)
                }
            }
        }
    } catch (err) {
        console.error('Error:', err);
    }
};



// Run the function immediately
deleteOldVideosDB();

// Run the function every 30 minutes
setInterval(deleteOldVideosDB, 1000 * 60 * 30);

module.exports = deleteOldVideosDB;