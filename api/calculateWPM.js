const { TextToSpeechClient } = require('@google-cloud/text-to-speech');
const fs = require('fs');
const path = require('path');
const util = require('util');
const voices = require('./voices.json');

const pathToKey = path.join(__dirname, './src/key.json');

const ttsClient = new TextToSpeechClient({
    keyFilename: pathToKey
});



async function getAudioDuration(filePath) {
    const mm = await import('music-metadata');
    const metadata = await mm.parseFile(filePath);
    return metadata.format.duration; // This will give the duration in seconds
}




async function synthesizeSpeech(text, languageCode = 'en-US', name = 'en-US-News-M') {
    const fileOutput = path.join(__dirname, `./${name}.wav`)
    var request = {
        input: { text: text },
        voice: { languageCode, ssmlGender: 'NEUTRAL', name },
        audioConfig: { audioEncoding: 'LINEAR16' },
    };

    const writeFile = util.promisify(fs.writeFile);
    // Use regular synthesizeSpeech for shorter texts
    const [response] = await ttsClient.synthesizeSpeech(request);
    await writeFile(fileOutput, response.audioContent, 'binary');
}


async function main() {

    var output = {}

    const wordCount = 89
    const text = "In the serene landscape of the town, a quiet river meandered through lush green meadows, flanked by tall oaks and willows. Children often played by its banks, their laughter echoing in the distance. Birds perched on the trees, filling the air with their melodious songs, while the gentle breeze rustled the leaves. The townspeople took pride in their beautiful surroundings, often taking long walks or having picnics by the river. It was a place where nature and humanity coexisted in harmonious rhythm, creating an atmosphere of peace and tranquility."

    const voice_list = voices['en-GB']
    for (const voice of voice_list) {
        const { language, name } = voice
        await synthesizeSpeech(text, language, `${language}-${name}`)
        const duration = await getAudioDuration(path.join(__dirname, `./${language}-${name}.wav`))
        const wpm = Math.round(wordCount / (parseFloat(duration) / 60))
        output[`${language}-${name}`] = wpm
    }

}

main()