const async = require('async');
const puppeteer = require('puppeteer');
const sharp = require('sharp');
const {join} = require("path");


const BROWSER_COUNT = 1
let browsers = [];

async function setupBrowsers() {
    for(let i = 0; i < BROWSER_COUNT; i++) {
        let b = await puppeteer.launch({
            // executablePath: '/usr/bin/google-chrome-stable',
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        browsers.push({
            browser: b,
            isBusy: false
        });

    }
}

function getAvailableBrowser() {
    return browsers.find(browser => !browser.isBusy);
}

function releaseBrowser(browserObj) {
    browserObj.isBusy = false;
}

async function htmlToPng(browser, task) {
    const imgPath = join(__dirname, `${task.folder}/screenshots/${task.id}.png`);
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 840 });

    if (task.html) {
        await page.setContent(task.html, { waitUntil: 'networkidle0' });
    } else if (task.url) {
        await page.goto(task.url, { waitUntil: 'networkidle0' });
    }

    try {
        await page.evaluate(() => {
            const embedContainer = document.getElementById('embed-container');
            if (embedContainer) {
                embedContainer.removeAttribute('style');
            }
            const blurredOverlay = document.getElementById('blurred-overlay');
            if (blurredOverlay) {
                blurredOverlay.parentNode.removeChild(blurredOverlay);
            }
        });

        const contentHeight = await page.evaluate(() => document.documentElement.offsetHeight);
        await page.setViewport({
            width: 390,
            height: contentHeight
        });

        const screenshotBuffer = await page.screenshot({type: 'png',fullPage: true});
        const {width, height} = await sharp(screenshotBuffer).metadata();

        await page.close();


        const maskBuffer = await sharp({
            create: {
                width: width,
                height: height,
                channels: 4,
                background: {r: 0, g: 0, b: 0, alpha: 0},
            },
        }).png()
            .composite([
                {
                    input: Buffer.from(
                        `<svg><rect x="0" y="0" width="${width}" height="${height}" rx="${20}" ry="${20}" style="fill:rgb(0,0,0);"/></svg>`
                    ),
                    blend: 'dest-over',
                },
            ])
            .toBuffer();

        await sharp(screenshotBuffer)
            .composite([{input: maskBuffer, blend: 'dest-in'}])
            .png()
            .toFile(imgPath);
    }catch (e) {
        console.log(e)
        return false
    }

    return true;


}

const queue = async.queue(async (task) => {
    try {
        let browserObj = getAvailableBrowser();
        while (!browserObj) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            browserObj = getAvailableBrowser();
        }
        await htmlToPng(browserObj.browser, task);
        releaseBrowser(browserObj);
        return null; // Success
    } catch (err) {
        throw err; // Error
    }
}, BROWSER_COUNT);

function addToQueue(data) {
    queue.push({ ...data }, (err) => {
        if (err) {
            return false;
        } else {
            return true;
        }
    });
}

setupBrowsers().then(r => console.log("Browser(s) setup"))


module.exports = {
    addToQueue,
    getAvailableBrowser
};
