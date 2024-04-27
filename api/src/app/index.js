
const { createCommentsVideo, createStoryVideo, savePost } = require('./scripts')
const reddit = require('./reddit')


async function createStoryVideos(subreddit) {
    const { page, browser } = await reddit.createBrowser_Login()

    const posts = await reddit.getSubreddit(subreddit, 15, 'week');


    for (var i = 0; i < posts.length; i++) {

        const exists = await savePost({
            id: posts[i].id,
            title: posts[i].title,
            url: posts[i].url,
            dateAdded: new Date().toLocaleDateString()
        });
        if (!exists) {
            console.log(`Creating Video: | STORY | ${posts[i].title}`)
            await createStoryVideo(posts[i], page)
            console.log(`Finished Video: | STORY | ${posts[i].title}`)
        } else {
            console.log(`Skipping Video: | STORY | ${posts[i].title}`)
        }

    }

    await browser.close();

}



async function createVideosWithComments(subreddit) {
    const { page, browser } = await reddit.createBrowser_Login()

    const posts = await reddit.getSubreddit(subreddit, 10, 'day');
    for (var i = 0; i < posts.length; i++) {

        const exists = await savePost({
            id: posts[i].id,
            title: posts[i].title,
            url: posts[i].url,
            dateAdded: new Date().toLocaleDateString()
        });

        if (!exists) {
            console.log(`Creating Video: | COMMENTS | ${posts[i].title}`)
            await createCommentsVideo(posts[i], page)
            console.log(`Finished Video: | COMMENTS | ${posts[i].title}`)
        } else {
            console.log(`Skipping Video: | COMMENTS | ${posts[i].title}`)
        }



    }

    await browser.close();
}




// createStoryVideos('AmItheAsshole');
// createStoryVideos('confession')
// createVideosWithComments('AskReddit')