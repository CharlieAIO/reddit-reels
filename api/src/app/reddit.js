const snoowrap = require('snoowrap');
const puppeteer = require('puppeteer');
const sharp = require('sharp');
const { setTimeout } = require('timers/promises');

const path = require('path');
const cleanTextReplacements = require('./cleanText')


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
        'top': () => posts.getTop({ time, limit, after }),
        'hot': () => posts.getHot({ limit, after }),
        'new': () => posts.getNew({ limit, after }),
        'rising': () => posts.getRising({ limit, after }),
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
    await submission.expandReplies({ limit: 50, depth: 1 });
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



async function takeScreenshot(page, url, id, folderName) {
    try {
        const radius = 20;
        await page.setViewport({
            width: 390,
            height: 840,
            deviceScaleFactor: 2
        });
        await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);

        await page.goto(url, { waitUntil: 'domcontentloaded' });  // Changed from 'domcontentloaded'

        const customSelector = 'div[data-test-id="post-content"]';
        let retries = 3; // Number of retries

        let elementHandle;

        // Retry mechanism
        while (retries > 0) {
            try {
                await page.waitForSelector(customSelector, { timeout: 20000 });  // Increased timeout
                elementHandle = await page.$(customSelector);

                if (elementHandle) {
                    break;
                }
            } catch (error) {
                console.log(`Element not found for URL ${url}. Retrying...`);
                retries -= 1;
            }
        }

        if (retries === 0) {
            throw new Error(`Element not found for URL ${url}`);
        }

        await page.evaluate((parentSelector, childSelector) => {
            const parentElement = document.querySelector(parentSelector);
            const childElement = parentElement.querySelector(childSelector);
            if (childElement) childElement.remove();
        }, customSelector, 'div[data-click-id="text"]');


        const screenshotBuffer = await elementHandle.screenshot({ type: 'png' });

        const { width, height } = await sharp(screenshotBuffer).metadata();

        const maskBuffer = await sharp({
            create: {
                width: width,
                height: height,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 },
            },
        }).png()
            .composite([
                {
                    input: Buffer.from(
                        `<svg><rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" ry="${radius}" style="fill:rgb(0,0,0);"/></svg>`
                    ),
                    blend: 'dest-over',
                },
            ])
            .toBuffer();

        await sharp(screenshotBuffer)
            .composite([{ input: maskBuffer, blend: 'dest-in' }])
            .png()
            .toFile(path.join(__dirname, `${folderName}/screenshots/${id}.png`));

        return true; // You can return any value or object based on your needs

    } catch (err) {
        console.error({
            error: err,
            url: url,
            id: id,
        });
        return false; // You can return false or any other value to indicate failure
    }
}




async function takeScreenshotComment(page, url, id, folderName) {
    try {
        const radius = 20;
        await page.setViewport({
            width: 390,
            height: 840,
            deviceScaleFactor: 2
        });
        await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);



        await page.goto(url, { waitUntil: 'domcontentloaded' });

        const customSelector = 'div._1ump7uMrSA43cqok14tPrG > *:first-child > *:first-child';
        let retries = 3; // Number of retries
        let elementHandle;
        while (retries > 0) {
            try {
                await page.waitForSelector(customSelector, { timeout: 20000 });  // Increased timeout
                elementHandle = await page.$(customSelector);

                if (elementHandle) {
                    break;
                }
            } catch (error) {
                retries -= 1;
            }
        }

        if (retries === 0) {
            throw new Error(`Element not found for URL ${url}`);
        }


        const screenshotBuffer = await elementHandle.screenshot({ type: 'png' });
        const { width, height } = await sharp(screenshotBuffer).metadata()
        const maskBuffer = await sharp({
            create: {
                width: width,
                height: height,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 },
            },
        }).png()
            .composite([
                {
                    input: Buffer.from(
                        `<svg><rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" ry="${radius}" style="fill:rgb(0,0,0);"/></svg>`
                    ),
                    blend: 'dest-over',
                },
            ])
            .toBuffer();

        await sharp(screenshotBuffer)
            .composite([{ input: maskBuffer, blend: 'dest-in' }])
            .png()
            .toFile(path.join(__dirname, `${folderName}/screenshots/${id}.png`));

        return true;


    } catch (err) {
        console.error({
            error: err,
            url: url,
            id: id,
        })
        try {
            await sharp({
                create: {
                    width: 390,
                    height: 840,
                    channels: 4,
                    background: { r: 0, g: 0, b: 0, alpha: 0 },
                },
            }).png().toFile(path.join(__dirname, `${folderName}/screenshots/${id}.png`));
        } catch { }
        return false;
    }
}

async function createBrowser_Login(username, password) {
    var success = false
    try {
        console.log(`logging in....`)
        // var browser = await puppeteer.launch({ headless: `new` });
        var browser = await puppeteer.launch({
            executablePath: '/usr/bin/google-chrome-stable',
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            protocolTimeout:100000
        });

        var page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36');
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9'
        });

        // console.log('Attempting to log in...');
        // await page.screenshot({path: 'pre-login-screenshot.png'}); // Taking a screenshot right before attempting to log in


        try {
            await page.goto('https://www.reddit.com/login/');
        } catch (e) {
            console.log('Error during navigation:', e);
            await page.screenshot({path: 'navigation-error.png'});
            throw e; // Re-throw to handle or log it higher up in your call stack
        }


        await page.setCookie({
            name: 'eu_cookie',
            value: '{%22opted%22:true%2C%22nonessential%22:true}'
        })

        // Wait for the username input field and enter the username
        await page.waitForSelector('input[name="username"]');
        await page.type('input[name="username"]', username);
        // await page.screenshot({path: 'username-type.png'});


        // Wait for the password input field and enter the password
        await page.waitForSelector('input[name="password"]');
        await page.type('input[name="password"]', password);

        // await page.screenshot({path: 'password-type.png'});


        await setTimeout(1500)
        let buttonClicked;
        try {
            buttonClicked = await page.evaluate(() => {
                let appElement = document.querySelector('shreddit-app > shreddit-overlay-display');
                if (!appElement) throw new Error('App element not found');
                let shadowRoot = appElement.shadowRoot;
                if (!shadowRoot) throw new Error('App element shadow root not found');

                let signupDrawerElement = shadowRoot.querySelector('shreddit-signup-drawer');
                if (!signupDrawerElement) throw new Error('Signup drawer element not found');
                shadowRoot = signupDrawerElement.shadowRoot;
                if (!shadowRoot) throw new Error('Signup drawer element shadow root not found');

                let shredditSlotterElement = shadowRoot.querySelector('shreddit-drawer > div > shreddit-async-loader > div > shreddit-slotter');
                if (!shredditSlotterElement) throw new Error('Slotter element not found');
                shadowRoot = shredditSlotterElement.shadowRoot;
                if (!shadowRoot) throw new Error('Slotter element shadow root not found');

                let buttonElement = shadowRoot.querySelector('button.login');
                if (!buttonElement) throw new Error('Login button not found');

                buttonElement.click();
                return true;
            });

        } catch (error) {
            console.error('An error occurred while trying to click the login button:', error);
        }

        // await page.screenshot({ path: "after-button-click.png" });
        // console.log('Screenshot taken.');


        if (buttonClicked) {
            console.log('Login button clicked');
        } else {
            console.log('Login button not clicked');
            return { page, browser, loggedIn: false }
        }

        // await page.waitForNavigation({ timeout: 120000 });


        console.log('Login Success', username);
        success = true
    } catch (e) {
        console.log(e)
        console.log('Login Failed', username);
        success = false
    }




    return { page, browser, loggedIn: success }

}

module.exports = {
    getSubreddit,
    getComments,
    cleanText,
    takeScreenshot,
    takeScreenshotComment,
    createBrowser_Login,
    getSpecificPost
}



