const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');


async function cropToTikTokPortrait(inputPath, tempPath) {
    return new Promise(async (resolve, reject) => {
        const tiktokAspectRatio = '9:16'; // TikTok portrait aspect ratio

        const [widthRatio, heightRatio] = tiktokAspectRatio.split(':').map(Number);
        const cropExpression = `ih*${widthRatio}/${heightRatio}:ih`;
        fs.renameSync(inputPath, tempPath);


        // Crop the video to the desired aspect ratio
        ffmpeg(tempPath)
            .outputOptions([
                '-preset ultrafast',
                '-vf', `crop=${cropExpression}`,
                '-c:a', 'copy',
            ])
            .save(inputPath)
            .on('end', () => {
                console.log('Finished processing');
                resolve(true);
            })
            .on('error', (err) => {
                console.error('Error:', err.message);
                reject(false);
            });
    })
}

module.exports = {
    cropToTikTokPortrait
}