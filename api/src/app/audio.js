const { TextToSpeechClient, TextToSpeechLongAudioSynthesizeClient } = require('@google-cloud/text-to-speech');
const { SpeechClient } = require('@google-cloud/speech');
const { Storage } = require('@google-cloud/storage');


const fs = require('fs');
const path = require('path');
const util = require('util');

const pathToKey = path.join(__dirname, '../key.json');

const ttsClient = new TextToSpeechClient({
    keyFilename: pathToKey
});
const ttsLongClient = new TextToSpeechLongAudioSynthesizeClient({
    keyFilename: pathToKey
});
const speechClient = new SpeechClient({
    keyFilename: pathToKey
});
const storageClient = new Storage({
    keyFilename: pathToKey
});

const bucketName = 'tiktok-reddit-audio-files'


async function synthesizeSpeech(text, fileOutput = path.join(__dirname, 'temp/tiktok_sound.wav'), GCS_FILENAME, languageCode = 'en-US', name = 'en-US-News-M') {

    var request = {
        input: { text: text },
        voice: { languageCode, ssmlGender: 'NEUTRAL', name },
        audioConfig: { audioEncoding: 'LINEAR16' },
    };

    // Check if the text is 5000 bytes or greater
    const textBuffer = Buffer.from(text, 'utf-8');
    if (textBuffer.length >= 5000) {
        const [operation] = await ttsLongClient.synthesizeLongAudio({
            ...request,
            parent: 'projects/plenary-anagram-250010/locations/global',
            outputGcsUri: `gs://${bucketName}/${GCS_FILENAME}`,
        });
        await operation.promise();
        await downloadFromGCS(fileOutput, GCS_FILENAME)
        await deleteFromGCS(GCS_FILENAME)
    } else {
        const writeFile = util.promisify(fs.writeFile);
        // Use regular synthesizeSpeech for shorter texts
        const [response] = await ttsClient.synthesizeSpeech(request);
        await writeFile(fileOutput, response.audioContent, 'binary');
    }
}

async function downloadFromGCS(fileOutput, GCS_FILENAME) {
    await storageClient.bucket(bucketName).file(GCS_FILENAME).download({
        destination: fileOutput,
    });


}


async function deleteFromGCS(GCS_FILENAME) {
    try {
        // Get a reference to the GCS bucket
        const bucket = storageClient.bucket(bucketName);

        // Delete the object from the GCS bucket
        await bucket.file(GCS_FILENAME).delete();

    } catch (error) {
        throw error;
    }
}

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

async function transcribe(GCS_FILENAME) {
    const gcsUri = `gs://${bucketName}/${GCS_FILENAME}`;

    const request = {
        audio: {
            uri: gcsUri,
        },
        config: {
            encoding: 'LINEAR16',
            sampleRateHertz: 24000, // Change this to match the WAV header if different
            languageCode: 'en-US',
            enableWordTimeOffsets: true,
        },
    };

    const [operation] = await speechClient.longRunningRecognize(request);
    const [response] = await operation.promise();

    return response.results;
}

function convertToSRT(results, srtFile = path.join(__dirname, 'temp/tiktok_sound.srt')) {
    function formatTime(seconds, milliseconds) {
        const date = new Date(seconds * 1000 + milliseconds);
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        const secondsStr = date.getUTCSeconds().toString().padStart(2, '0');
        const millisecondsStr = date.getUTCMilliseconds().toString().padStart(3, '0');
        return `${hours}:${minutes}:${secondsStr},${millisecondsStr}`;
    }

    let srtOutput = "";
    let counter = 1;

    for (let result of results) {
        for (let wordInfo of result.alternatives[0].words) {
            const start = formatTime(wordInfo.startTime.seconds, wordInfo.startTime.nanos / 1e6);
            const end = formatTime(wordInfo.endTime.seconds, wordInfo.endTime.nanos / 1e6);

            srtOutput += counter++ + '\n';
            srtOutput += `${start} --> ${end}\n`;
            srtOutput += wordInfo.word + '\n\n';
        }
    }

    fs.writeFileSync(srtFile, srtOutput);
    return srtOutput;
}

async function mergeAudio(ref, folderName) {
    const outputFile = path.join(__dirname, `${folderName}/tiktok_sound.wav`);

    let outputData = []
    let totalLength = 0
    ref.forEach((file, index) => {
        const data = fs.readFileSync(file.audio);
        const audioData = (index === 0) ? data : data.slice(44);

        outputData.push(audioData);
        totalLength += audioData.length;
    });

    const combinedData = Buffer.concat(outputData, totalLength);
    combinedData.writeUInt32LE(totalLength - 44, 40);

    fs.writeFileSync(outputFile, combinedData);


}


async function transcribe_to_srt(folderName, GCS_FILENAME) {
    const fileName = path.join(__dirname, `${folderName}/tiktok_sound.wav`)
    await uploadToGCS(fileName, GCS_FILENAME)
    const ts = await transcribe(GCS_FILENAME)
    await convertToSRT(ts, fileName.replace('.wav', '.srt'))
    await deleteFromGCS(GCS_FILENAME)
    return true
}



module.exports = {
    synthesizeSpeech,
    transcribe_to_srt,
    mergeAudio
}