const {createVideo_api} = require("./src/app/scripts");
const {getAvailableBrowser} = require("./src/app/redditQueueHandler");
const reddit = require("./src/app/reddit");

async function test() {
    console.log("reddit reels test video")

    const task = {
        generateType: 'Comments',
        bgVideo: "gta_1_default.mp4",
        subredditType: "Auto",
        manualURL: null,
        subreddit:'askreddit',
        sortBy: "Hot",
        timeFrame:  "N/A",
        minLength: 30,
        maxLength: null,
        captions: false,
        num:1,
        socket:null,
        username:'charlieaio'
    }
    while(!getAvailableBrowser()) {
        // console.log("waiting for browser")
        await new Promise(resolve => setTimeout(resolve, 1000))
    }
    console.log("processing task")
    const res = await createVideo_api(
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
}

test()