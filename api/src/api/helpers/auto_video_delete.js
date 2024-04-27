const { Storage } = require('@google-cloud/storage');
const path = require('path');


const pathToKey = path.join(__dirname, '../../../key.json');
const storageClient = new Storage({
    keyFilename: pathToKey
});

// Your bucket name
const bucketName = 'reddit-reels-output';

// Function to delete old videos
const deleteOldVideos = async () => {
    try {
        const [files] = await storageClient.bucket(bucketName).getFiles();
        const currentTime = new Date();

        for (const file of files) {
            const [metadata] = await file.getMetadata();
            const timeCreated = new Date(metadata.timeCreated);
            const ageInDays = (currentTime - timeCreated) / (1000 * 60 * 60 * 24);

            if (ageInDays > 7) {
                await file.delete();
                console.log(`Deleted video: ${file.name}`);
            }
        }
    } catch (err) {
        console.error('Error:', err);
    }
};



// Run the function immediately
deleteOldVideos();

// Run the function every 30 minutes
setInterval(deleteOldVideos, 1000 * 60 * 30);

module.exports = deleteOldVideos;