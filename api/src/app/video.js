const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const { uploadToGCS } = require('../api/helpers/utils')

// windows
// ffmpeg.setFfprobePath(path.join(__dirname, '../ffmpeg/ffprobe.exe'));
// ffmpeg.setFfmpegPath(path.join(__dirname, '../ffmpeg/ffmpeg.exe'));


const outputOptions = '-crf 17'

function generateFilters(subtitlesFilePath, fontName = 'Lilita One', fontColor = '#ffffff') {

    function convertColorToAss(hexColor) {
        // Remove '#' if present
        hexColor = hexColor.replace('#', '');

        // Extract the red, green, and blue channels
        const red = hexColor.slice(0, 2);
        const green = hexColor.slice(2, 4);
        const blue = hexColor.slice(4, 6);

        // Reorder the channels to BGR and add the prefix and suffix
        return `&H00${blue}${green}${red}&`;
    }

    const fontSize = 24;
    const subtitlePosition = { x: 10, y: -25 };
    const outlineThickness = 1;
    const outlineColor = '&H000000';


    const forceStyle = `Fontsize=${fontSize},Fontname='${fontName}',PrimaryColour=${convertColorToAss(fontColor)},`
        + `Outline=${outlineThickness},OutlineColour=${outlineColor},`
        + `Alignment=${subtitlePosition.x},${subtitlePosition.y}`;



    const videoFilter = `subtitles=${subtitlesFilePath}:force_style=\'${forceStyle}\'`;





    return videoFilter;
}

function getAudioDuration(inputAudioPath) {
    return new Promise((resolve, reject) => {

        ffmpeg.ffprobe(inputAudioPath, (err, metadata) => {
            if (err) {
                reject(err, 'get audio duration error');
                return;
            }
            var audioDuration = metadata.format.duration;
            return resolve(audioDuration);
        })

    });
}

function stripAudioFromVideo(inputVideoPath, folderName, preset = 'ultrafast') {
    return new Promise((resolve, reject) => {
        const savePath = path.join(__dirname, `${folderName}/temp_output_strip_${Date.now()}.mp4`);

        ffmpeg()
            .input(inputVideoPath)
            .noAudio()
            .outputOptions(`-preset ${preset} ${outputOptions}`.split(' '))
            .save(savePath)
            .on('end', () => resolve(savePath))
            .on('error', (err) => reject(err, 'strip audio from video error'));
    });
}

function cutVideoToRandomPart(nextPath, audioDuration, folderName, preset = 'ultrafast') {
    return new Promise(async (resolve, reject) => {
        const savePath = path.join(__dirname, `${folderName}/temp_output_cut_${Date.now()}.mp4`);
        // Get the video duration

        if (!fs.existsSync(nextPath)) return cutVideoToRandomPart(nextPath)

        ffmpeg.ffprobe(nextPath, (err, videoMetadata) => {
            if (err) {
                reject(err);
                return;
            }
            const videoDuration = videoMetadata.format.duration;
            const maxStartTime = videoDuration - audioDuration;
            const randomStartTime = Math.random() * maxStartTime;

            ffmpeg(nextPath)
                .setStartTime(randomStartTime)
                .setDuration(audioDuration)
                .outputOptions(`-preset ${preset} ${outputOptions}`.split(' '))
                .save(savePath)
                .on('end', () => resolve(savePath))
                .on('error', (err) => reject(err, 'cut video to random part error'));
        });
    });

}

function combineVideoWithAudio(nextPath, inputAudioPath, folderName, preset = 'ultrafast') {
    return new Promise((resolve, reject) => {
        const savePath = path.join(__dirname, `${folderName}/temp_output_combine_${Date.now()}.mp4`)

        if (!fs.existsSync(nextPath)) return combineVideoWithAudio(nextPath)

        ffmpeg(nextPath)
            .input(inputAudioPath)
            .complexFilter([
                '[0:v] [1:a] concat=n=1:v=1:a=1 [v] [a]'
            ], ['v', 'a'])
            .outputOptions(`-preset ${preset} ${outputOptions}`.split(' '))
            .save(savePath)
            .on('end', () => resolve(savePath))
            .on('error', (err) => reject(err, 'combine video with audio error'));
    });
}

function applyCaptionsToVideo(nextPath, font, color, folderName, preset = 'ultrafast') {

    return new Promise((resolve, reject) => {
        const savePath = path.join(__dirname, `${folderName}/temp_output_captions_${Date.now()}.mp4`);
        const subtitlePath = `./${folderName.split('../.')[1]}/tiktok_sound.srt`


        const filters = generateFilters(subtitlePath, font, color);



        if (!fs.existsSync(nextPath)) return reject(new Error('Next path does not exist'));

        ffmpeg(nextPath)
            .videoFilters(filters)
            .outputOptions(`-preset ${preset} ${outputOptions}`.split(' '))
            .save(savePath)
            .on('end', () => resolve(savePath))
            .on('error', (err) => reject(err, 'apply captions to video error'));
    });
}

function overlayScreenshot(nextPath, imagePath, startTime, audioDuration, folderName, captions, preset = 'ultrafast') {
    return new Promise((resolve, reject) => {
        const savePath = path.join(__dirname, `${folderName}/temp_output_overlay_${Date.now()}.mp4`); // Unique temporary file

        if (!fs.existsSync(nextPath)) return overlayScreenshot(nextPath, imagePath, startTime, audioDuration, folderName, captions);

        ffmpeg.ffprobe(nextPath, async (err, metadata) => {
            if (err) {
                reject(err);
                return;
            }


            if (!fs.existsSync(imagePath)) {
                await sharp({
                    create: {
                        width: 390,
                        height: 840,
                        channels: 4,
                        background: { r: 0, g: 0, b: 0, alpha: 0 },
                    },
                }).png().toFile(imagePath);
            }

            const videoWidth = metadata.streams[0].width;
            const videoHeight = metadata.streams[0].height;
            const maxOverlayHeight = Math.floor(videoHeight / 3); // Maximum height for the overlay image
            const leftMargin = 40; // Margin on the left side
            const rightMargin = 40; // Margin on the right side

            ffmpeg.ffprobe(imagePath, (err, imgMetadata) => {
                if (err) {
                    reject(err);
                    return;
                }

                const imgWidth = imgMetadata.streams[0].width;
                const imgHeight = imgMetadata.streams[0].height;

                // Maintain aspect ratio while calculating maxOverlayHeight
                const aspectRatio = imgWidth / imgHeight;
                // Calculate maxOverlayWidth based on maxOverlayHeight and aspect ratio
                const maxOverlayWidth = Math.floor(maxOverlayHeight * aspectRatio);
                // Use whichever is smaller: maxOverlayWidth or (videoWidth - leftMargin - rightMargin)
                const overlayWidth = Math.min(maxOverlayWidth, videoWidth - leftMargin - rightMargin);
                // Recalculate maxOverlayHeight based on the new overlayWidth
                const overlayHeight = Math.floor(overlayWidth / aspectRatio);

                let overlayXPosition;
                let overlayYPosition;

                if (!captions) {
                    // Center the image
                    overlayXPosition = (videoWidth - overlayWidth) / 2;
                    overlayYPosition = (videoHeight - overlayHeight) / 2;
                } else {
                    overlayXPosition = (videoWidth - overlayWidth) / 2;
                    overlayYPosition = 40;
                }




                ffmpeg()
                    .input(nextPath)
                    .input(imagePath)
                    .complexFilter([
                        {
                            filter: 'scale',
                            options: `${overlayWidth}:${overlayHeight}`,
                            inputs: '1:v',
                            outputs: 'scaled'
                        },
                        {
                            filter: 'overlay',
                            options: {
                                x: overlayXPosition,
                                y: overlayYPosition,
                                enable: `between(t, ${startTime}, ${startTime + audioDuration})`
                            },
                            inputs: ['0:v', 'scaled']
                        }
                    ])
                    .outputOptions(`-preset ${preset} ${outputOptions}`.split(' '))
                    .save(savePath)
                    .on('end', () => {
                        fs.unlinkSync(nextPath);
                        resolve(savePath);
                    })
                    .on('error', (err) => reject(err, 'overlay screenshot error'));
            });
        });
    });
}



async function overlayScreenshotsWithAudio(videoPath, refs, tempPath, captions, preset = 'ultrafast') {
    return new Promise(async (resolve, reject) => {
        let nextPath = videoPath;

        if (!fs.existsSync(nextPath)) return overlayScreenshotsWithAudio(nextPath, refs, tempPath, captions)
        // const totalAudioDuration = refs.reduce(async (sum, ref) => sum + await getAudioDuration(`./ audio / ${ ref.id }.wav`), 0);
        let currentStartTime = 0;

        for (const ref of refs) {
            if (!ref.screenshot) continue;

            const audioDuration = await getAudioDuration(ref.audio);
            nextPath = await overlayScreenshot(nextPath, ref.screenshot, currentStartTime, audioDuration, tempPath, captions, preset);

            currentStartTime += audioDuration;
        }

        return resolve(nextPath);
    })
}

// function saveVideo(nextPath, outputPath) {
//     return new Promise((resolve, reject) => {
//         fs.rename(nextPath, outputPath, (err) => {
//             if (err) {
//                 reject(err, 'save video error');
//             } else {
//                 resolve(outputPath);
//             }
//         });
//     });
// }



async function processVideo(inputVideoPath, inputAudioPath, outputPath, refs, font, color, tempPath, captions, preset = 'ultrafast') {
    const audioDuration = await getAudioDuration(inputAudioPath)
    var nextPath = await cutVideoToRandomPart(inputVideoPath, audioDuration, tempPath, preset)
    nextPath = await stripAudioFromVideo(nextPath, tempPath, preset)
    if (captions) {
        nextPath = await applyCaptionsToVideo(nextPath, font, color, tempPath, preset)
    }
    nextPath = await overlayScreenshotsWithAudio(nextPath, refs, tempPath, captions, preset)
    nextPath = await combineVideoWithAudio(nextPath, inputAudioPath, tempPath, preset)
    // await saveVideo(nextPath, outputPath)
    await uploadToGCS(nextPath, outputPath)

    return audioDuration
}


module.exports = processVideo