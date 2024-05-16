
const fs = require('fs');
const path = require('path');

const { updateFeed, fileExistsInGCS } = require('../api/helpers/utils')
const mongo = require('../api/helpers/mongo')
const { deductFromBalance } = require('../api/helpers/stripe')
const reddit = require('./reddit.js');
const audio = require('./audio.js');
const processVideo = require('./video.js');
const { addToQueue } = require('./redditQueueHandler')

function isTextLongEnough(totalWordsRequired, text) {
    if (!totalWordsRequired) return true
    const wordCount = text.split(' ').length;
    return wordCount >= totalWordsRequired;
}

function isTextShortEnough(maxWordsAllowed, text) {
    if (!maxWordsAllowed) return true
    const wordCount = text.split(' ').length;
    return wordCount <= maxWordsAllowed;
}

async function handleTemp(folderName = './temp', del = false) {
    const tempPath = path.join(__dirname, folderName)
    if (del) {
        fs.rmSync(tempPath, { recursive: true })

    } else {
        fs.mkdirSync(tempPath, { recursive: true })
        fs.mkdirSync(path.join(tempPath, 'screenshots'), { recursive: true })
        fs.mkdirSync(path.join(tempPath, 'audio'), { recursive: true })
    }
}

const default_bg_videos = [
    {
        filePath: "minecraft_parkour_1_default.mp4",
        fileName: "minecraft_parkour_1_default.mp4",
    },
    {
        filePath: "minecraft_parkour_2_default.mp4",
        fileName: "minecraft_parkour_2_default.mp4",
    },
    {
        filePath: "trackmania_default.mp4",
        fileName: "trackmania_default.mp4",
    },
    {
        filePath: "gta_1_default.mp4",
        fileName: "gta_1_default.mp4",
    }
]
const videoPreset = 'ultrafast'

async function createVideo_api(type, username, subreddit, sortBy, timeFrame, bgVideo, minVideoLength = null, maxVideoLength = null, subredditType = 'Auto', manualURL = null, captions = true, num = 1, socket) {

    const max_comment_length = 500
    var userAccount = await mongo.getAccount(username)
    const font = userAccount.font || null
    const subtitleColor = userAccount.subtitleColor ? userAccount.subtitleColor : '#FFFFFF'
    const voice = userAccount?.voice ? userAccount.voice : { languageCode: 'en-US', name: 'en-US-Wavenet-H', wpm: 179 }

    userAccount.videos = [...default_bg_videos, ...userAccount.videos || []]


    const WPM = voice?.wpm ? voice.wpm : 179

    const totalWordsRequired = minVideoLength ? (WPM * (parseFloat(minVideoLength) / 60)) : null
    const maxWordsAllowed = maxVideoLength ? (WPM * (parseFloat(maxVideoLength) / 60)) : null


    async function getPosts(subreddit, sortBy, timeFrame, totalWordsRequired, maxWordsAllowed, userAccount, attempts_to_get_posts = 0) {

        var lastPost = null
        var posts = await reddit.getSubreddit(subreddit, 10, timeFrame.toLowerCase(), sortBy.toLowerCase(), lastPost);
        lastPost = posts[posts.length - 1]?.id

        async function combineText(post) {
            var id = post.id
            var text = post.title + "\n\n" + post.text?.trim() || post.selftext?.trim() || '';
            var comments = []
            if (type === 'Comments') {
                let newComments = [];
                let comments_ = await reddit.getComments(id);
                let commentBodys = comments_.map(e => e.body.trim());

                let currentWordCount = text.split(' ').length;

                for (let i = 0; i < commentBodys.length; i++) {
                    if (commentBodys[i].length > max_comment_length) continue;

                    let commentWordCount = commentBodys[i].split(' ').length;
                    let newWordCount = currentWordCount + commentWordCount;


                    let meetsMinLimit = (totalWordsRequired === null) || (newWordCount >= totalWordsRequired);
                    let underMaxLimit = (maxWordsAllowed === null) || (newWordCount <= maxWordsAllowed);

                    // If adding the current comment keeps the word count under the max limit or there's no max limit
                    if (underMaxLimit) {
                        comments.push(comments_[i]);
                        newComments.push(commentBodys[i]);
                        text += " " + commentBodys[i];
                        currentWordCount = newWordCount;
                    }

                    // If the minimum word count limit is met, break out of the loop
                    if (meetsMinLimit) {
                        break;
                    }
                }
            }


            return { text, comments };
        }



        async function filterPosts(posts, totalWordsRequired, maxWordsAllowed) {
            const promises = posts.map(async (post, indx) => {
                const { text, comments } = await combineText(post);
                posts[indx].comments = comments
                return (isTextLongEnough(totalWordsRequired, text) && isTextShortEnough(maxWordsAllowed, text)) ? post : null;
            });

            const results = await Promise.all(promises);
            return results.filter(post => post !== null);
        }

        posts = posts.filter(e => !userAccount.redditsUsed?.includes(e.id))
        const filteredPosts = await filterPosts(posts, totalWordsRequired, maxWordsAllowed);

        if (filteredPosts.length === 0) {
            if (attempts_to_get_posts < 5) {
                attempts_to_get_posts++
                return getPosts(subreddit, sortBy, timeFrame, totalWordsRequired, maxWordsAllowed, userAccount, attempts_to_get_posts)
            } else {
                return []
            }
        }
        return filteredPosts
    }

    var posts = []
    if (subredditType === 'Auto') {
        posts = await getPosts(subreddit, sortBy, timeFrame, totalWordsRequired, maxWordsAllowed, userAccount)
        if (posts.length === 0) {
            await updateFeed(socket, `No reddit posts`, parseFloat(Date.now()), 'bg-red-500', username);
            return
        }
    } else {
        const postID = manualURL.split('/comments/')[1].split('/')[0]
        var post = await reddit.getSpecificPost(postID)
        if (!post) {
            await updateFeed(socket, `Reddit post not found`, parseFloat(Date.now()), 'bg-red-500', username);
            return
        }
        if (type === 'Comments') {
            const comments = await reddit.getComments(postID)
            post.comments = comments
        }


        posts.push(post)
    }

    var used = []

    for (var i = 0; i < num; i++) {
        const videoID = `${posts[i].id}_${username}_${new Date().getTime().toString().substr(-6)}.mp4`

        const videopath = bgVideo === "Random" ? (
            userAccount.videos[Math.floor(Math.random() * userAccount.videos.length)].filePath
        ) : (userAccount.videos.find(e => e.fileName === bgVideo).filePath)



        if (!fs.existsSync(path.join(__dirname, `../../videos/${videopath}`))) {
            throw new Error('Video file not found')
        }


        var vidLength = 0;
        if (type === 'Comments') vidLength = await createCommentsVideo(posts[i], font, subtitleColor, voice, posts[i].comments, videopath, videoID, captions)
        else if (type === 'Story') vidLength = await createStoryVideo(posts[i], font, subtitleColor, voice, videopath, videoID, captions)
        used.push(
            [posts[i].id, videoID, posts[i].title, vidLength]
        )
    }



    for (var i = 0; i < used.length; i++) {
        // Wait for maximum of 1 minute and check every 10 seconds
        const maxAttempts = 6;
        let attempt = 0;
        let ouputExists = false;

        while (attempt < maxAttempts) {
            ouputExists = await fileExistsInGCS(used[i][1]);
            if (ouputExists) break;

            attempt++;
            await new Promise(resolve => setTimeout(resolve, 10000)); // Wait for 10 seconds
        }

        if (ouputExists) {
            const newVID = {
                id: used[i][1],
                redditID: used[i][0],
                title: used[i][2],
                subreddit,
                videoLength: used[i][3],
                timestamp: parseFloat(Date.now())
            };
            await deductFromBalance(username);
            await mongo.updateReddit_Output(username, used[i][0], newVID);
            const msg = `${type} video generated (${subreddit})`;
            await updateFeed(socket, msg, parseFloat(Date.now()), 'bg-green-500', username);
            socket.to(username).emit('new-video', newVID);
        }
    }



}






async function createCommentsVideo(post, font, color, voice, comments, video, videoID, captions) {
    const folderName = `../../temp_${new Date().getTime()}`
    await handleTemp(folderName)

    const postID = post.id
    const postTitle = post.title
    const postText = post.text || post.selftext || ''
    const postURL = post.url



    var ref = []

    var text = postTitle + "\n\n" + postText;

    addToQueue({ type: "screenshot", url: postURL, id: postID, folder: folderName })
    // await reddit.takeScreenshot(page, postURL, postID, folderName)
    const GCS_FILENAME_AUDIO_TEXT = `tiktok_sound_${postID}_${Date.now().toString().substr(-5)}_text.wav`
    await audio.synthesizeSpeech(reddit.cleanText(text.trim()), path.join(__dirname, `${folderName}/audio/${postID}.wav`), GCS_FILENAME_AUDIO_TEXT, voice?.languageCode || 'en-US', voice?.name || 'en-US-Standard-A');

    ref.push({
        pos: 0,
        id: postID,
        screenshot: path.join(__dirname, `${folderName}/screenshots/${postID}.png`),
        audio: path.join(__dirname, `${folderName}/audio/${postID}.wav`)
    })

    for (var x = 0; x < (comments.length >= 20 ? 20 : comments.length); x++) {

        function replacePart(url) {
            const parts = url.split('/');
            if (parts.length >= 8) {
                parts[7] = 'comment';
            }
            return parts.join('/');
        }

        const commentLink = replacePart(`https://www.reddit.com${comments[x].permalink}`)
        const commentID = `${postID}_${comments[x].id}`
        // await reddit.takeScreenshotComment(page, commentLink, commentID, folderName)
        addToQueue({ type: "comment", url: commentLink, id: commentID, folder: folderName })

        const GCS_FILENAME_AUDIO_ = `tiktok_sound_${postID}_${Date.now().toString().substr(-5)}_${x}.wav`
        await audio.synthesizeSpeech(reddit.cleanText(comments[x].body.trim()), path.join(__dirname, `${folderName}/audio/${commentID}.wav`), GCS_FILENAME_AUDIO_, voice?.languageCode || 'en-US', voice?.name || 'en-US-Standard-A');
        ref.push({
            pos: x + 1,
            id: commentID,
            screenshot: path.join(__dirname, `${folderName}/screenshots/${commentID}.png`),
            audio: path.join(__dirname, `${folderName}/audio/${commentID}.wav`)
        })
    }

    await audio.mergeAudio(ref, folderName)

    if (captions) {
        const GCS_FILENAME_SRT = `tiktok_sound_${postID}_${Date.now().toString().substr(-5)}_SRT.wav`
        await audio.transcribe_to_srt(folderName, GCS_FILENAME_SRT)
    }

    // path.join(__dirname, `../../output/${videoID}`),
    const videoLength = await processVideo(
        path.join(__dirname, `../../videos/${video}`),
        path.join(__dirname, `${folderName}/tiktok_sound.wav`),
        videoID,
        ref, font, color, folderName, captions, videoPreset)
    await handleTemp(folderName, true)
    return videoLength
}



async function createStoryVideo(post, font, color, voice, video, videoID, captions) {
    const folderName = `../../temp_${new Date().getTime()}`
    await handleTemp(folderName)
    const postID = post.id
    const postTitle = post.title
    const postText = post.text || post.selftext || ''
    const postURL = post.url




    addToQueue({ type: "screenshot", url: postURL, id: postID, folder: folderName })
    // await reddit.takeScreenshot(page, postURL, postID, folderName)
    const GCS_FILENAME_AUDIO_TITLE = `tiktok_sound_${postID}_${Date.now().toString().substr(-5)}_title.wav`
    await audio.synthesizeSpeech(reddit.cleanText(postTitle.trim()), path.join(__dirname, `${folderName}/audio/title.wav`), GCS_FILENAME_AUDIO_TITLE, voice?.languageCode || 'en-US', voice?.name || 'en-US-Standard-A');
    const GCS_FILENAME_AUDIO_TEXT = `tiktok_sound_${postID}_${Date.now().toString().substr(-5)}_text.wav`
    await audio.synthesizeSpeech(reddit.cleanText(postText.trim()), path.join(__dirname, `${folderName}/audio/text.wav`), GCS_FILENAME_AUDIO_TEXT, voice?.languageCode || 'en-US', voice?.name || 'en-US-Standard-A');

    var ref = [
        {
            "pos": 0,
            "id": `${postID}_title`,
            "screenshot": path.join(__dirname, `${folderName}/screenshots/${postID}.png`),
            "audio": path.join(__dirname, `${folderName}/audio/title.wav`)
        },
        {
            "pos": 1,
            "id": `${postID}`,
            "screenshot": null,
            "audio": path.join(__dirname, `${folderName}/audio/text.wav`)
        },
    ]

    await audio.mergeAudio(ref, folderName)

    if (captions) {
        const GCS_FILENAME_SRT = `tiktok_sound_${postID}_${Date.now().toString().substr(-5)}_SRT.wav`
        await audio.transcribe_to_srt(folderName, GCS_FILENAME_SRT)
    }

    // path.join(__dirname, `../../output/${videoID}`)
    const videoLength = await processVideo(
        path.join(__dirname, `../../videos/${video}`),
        path.join(__dirname, `${folderName}/tiktok_sound.wav`),
        videoID,
        ref, font, color, folderName, captions, videoPreset
    )
    await handleTemp(folderName, true)
    return videoLength
}

module.exports = {
    createCommentsVideo,
    createStoryVideo,
    createVideo_api
}