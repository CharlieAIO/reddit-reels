const snoowrap = require('snoowrap');
const axios = require('axios');
const cleanTextReplacements = require('./cleanText')
const fs = require("fs");


const reddit = new snoowrap({
    userAgent: 'YOUR_USER_AGENT',
    clientId: '84PdFvDp-lO0erDZz51chw',
    clientSecret: 'RPc4dMxqDt9wJRXvKtAIbBCexUhECQ',
    username: 'CoupleNo2199',
    password: 'mfk5hrq3hma8uge_EQF',
});


async function getSpecificPost(postId) {
    const submission = await reddit.getSubmission(postId).fetch()
    return submission
}

async function getSubreddit(subredditName, limit = 15, time = 'day', sort = 'top', after = null) {
    // get posts past an index that have already been scraped


    const posts = await reddit
        .getSubreddit(subredditName);

    const sortMethod = {
        'top': () => posts.getTop({time, limit, after}),
        'hot': () => posts.getHot({limit, after}),
        'new': () => posts.getNew({limit, after}),
        'rising': () => posts.getRising({limit, after}),
    };
    const sortedPosts = await sortMethod[sort]?.() || [];

    return sortedPosts.filter(e => !e?.stickied).map(e => {
        return {
            text: cleanText(e.selftext),
            title: e.title,
            id: e.id,
            url: e.url
        }
    })

}

async function getComments(postId) {
    const submission = await reddit.getSubmission(postId);
    await submission.expandReplies({limit: 50, depth: 1});
    return submission.comments.filter(e => !['moderator'].includes(e.distinguished));

}

function cleanText(text) {


    const words = text.split(" ");
    for (let i = 0; i < words.length; i++) {
        const lowerWord = words[i].toLowerCase();
        if (lowerWord in cleanTextReplacements) {
            words[i] = cleanTextReplacements[lowerWord];
        }
    }

    return words.join(" ");
}


async function getScreenshotHTML(path) {
    try {
        const response = await axios.get(`https://embed.reddit.com${path}`)
        if(response.status === 200) {
            return response.data
        }
    } catch(e) {
        console.log(`error getting html ${e}`)
        return null;
    }
}

getScreenshotHTML('/r/AskReddit/comments/1djc25b/what_goes_through_a_mans_mind_when_hes_caught/').then((r) => {
    fs.writeFileSync('reddit.html',r)
})

module.exports = {
    getSubreddit,
    getComments,
    cleanText,
    getSpecificPost,
    getScreenshotHTML
}



