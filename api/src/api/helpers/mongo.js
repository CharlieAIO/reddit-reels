const { MongoClient, ServerApiVersion } = require("mongodb");


const client = new MongoClient(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 })

async function initMongo() {
    await client.connect()
}

async function getCollection(collectionName) {
    return await client.db('general').collection(collectionName)
}

async function setResetPasswordCode(email, code) {
    try {
        const collection = await getCollection('accounts')
        const result = await collection.updateOne({ email }, { $set: { pswdResetCode: code } })
        return result?.matchedCount > 0
    } catch { return false }
}

async function resetPassword(code, password) {
    try {
        const collection = await getCollection('accounts')
        const result = await collection.updateOne({ pswdResetCode: code }, {
            $set: { password },
            $unset: { pswdResetCode: "" }
        })
        return result?.modifiedCount > 0
    } catch { return false }
}

async function verifyAccount(code) {
    try {
        const collection = await getCollection('accounts')
        const result = await collection.updateOne({ verificationCode: code }, {
            $set: { verified: true },
            $unset: { verificationCode: "" }
        })
        return result?.modifiedCount > 0
    } catch { return false }
}

async function updateVerificationCode(email, code) {
    try {
        const collection = await getCollection('accounts')
        const result = await collection.updateOne({ email, verified: false }, { $set: { verificationCode: code, verified: false } })
        return result?.matchedCount > 0
    } catch { return false }
}

async function addAccount(account) {
    try {
        const collection = await getCollection('accounts')
        // ensure unique username and email
        const existingAccount = await collection.findOne({ $or: [{ username: account.username }, { email: account.email }] })
        if (existingAccount) return false

        const result = await collection.insertOne(account)
        return result
    } catch { return false }
}

async function disableAccount(account) {
    try {
        const collection = await getCollection('accounts')
        const result = await collection.updateOne({ username: account.username }, { $set: { disabled: true } })
        return result
    } catch { return false }
}

async function getAccount(username_email) {
    try {
        const collection = await getCollection('accounts')
        const result = await collection.findOne({ $or: [{ username: username_email }, { email: username_email }] })
        return result
    } catch { return false }
}

async function updateSubtitleColor(color_, username) {
    try {
        const collection = await getCollection('accounts')
        const result = await collection.updateOne({ username: username }, { $set: { subtitleColor: color_ } })
        return result
    } catch { return false }
}

async function saveFont(fontFile, username) {
    try {
        const collection = await getCollection('accounts')
        const result = await collection.updateOne({ username: username }, { $set: { font: fontFile } })
        return result
    } catch { return false }
}

async function lookupBGVideo(videoFile, username) {
    try {
        const collection = await getCollection('accounts')
        const result = await collection.findOne({ username: username, videos: { $elemMatch: { fileName: videoFile } } }, { projection: { "videos.$": 1 } })
        return result?.videos[0]?.filePath || null
    } catch { return false }
}

async function addBGVideo(videoFile, username) {
    try {
        const collection = await getCollection('accounts')
        // check if videoFile.fileName already exists if so add a random number to the end
        videoFile.fileName = await collection.findOne({ username: username, 'videos.fileName': videoFile.fileName }) ? videoFile.fileName + '-' + Math.floor(Math.random() * 1000) : videoFile.fileName

        const result = await collection.updateOne({ username: username }, { $push: { videos: videoFile } })
        return result
    } catch { return false }
}

async function lookupVideo(vidID, username) {
    try {
        const collection = await getCollection('accounts')
        const result = await collection.findOne({ username: username, outputVideos: { $elemMatch: { id: vidID } } }, { projection: { "outputVideos.$": 1 } })
        return result?.outputVideos?.length > 0
    } catch { return false }
}

async function delBGVideo(videoFile, username) {
    try {
        const collection = await getCollection('accounts')
        const result = await collection.updateOne({ username: username }, { $pull: { videos: { fileName: videoFile } } })
        return result
    } catch { return false }
}

async function updateReddit_Output(username, id, vid) {
    try {
        const collection = await getCollection('accounts')
        const result = await collection.updateOne({ username: username }, { $push: { redditsUsed: id, outputVideos: vid } })
        return result
    } catch { return false }
}

async function delOutputVideo(username, id) {
    try {
        const collection = await getCollection('accounts');

        // Match the account with the given username and the specific outputVideo with the given id
        const query = {
            username: username,
            "outputVideos.id": id
        };

        // Use the positional $ operator to update the matched outputVideo item
        const update = {
            $set: { "outputVideos.$.deleted": true }
        };

        const result = await collection.updateOne(query, update);
        return result;
    } catch {
        return false;
    }
}



async function updateVidoesGenerated(username, id) {
    try {
        const collection = await getCollection('accounts')
        const result = await collection.updateOne({ username: username }, { $push: { generated: id } })
        return result
    } catch { return false }
}

async function setCustomerId(cusId, username) {
    try {
        const collection = await getCollection('accounts')
        const result = await collection.updateOne({ username: username }, { $set: { customerId: cusId } })
        return result
    } catch { return false }
}

async function setVoice(voice_, username) {
    try {
        const collection = await getCollection('accounts')
        const result = await collection.updateOne({ username: username }, { $set: { voice: voice_ } })
        return result
    } catch { return false }
}

async function setTikTok(tiktok_, username) {
    try {
        const collection = await getCollection('accounts')
        const result = await collection.updateOne({ username: username }, { $set: { tiktok: tiktok_ } })
        return result
    } catch { return false }
}

async function updateBalanceLastUpdated(username, ts_) {
    try {
        const collection = await getCollection('accounts')
        const result = await collection.updateOne({ username: username }, { $set: { balanceLastUpdated: ts_ } }, { upsert: true })
        return result
    } catch { return false }
}

module.exports = {
    client,
    initMongo,
    getCollection,
    addAccount,
    disableAccount,
    getAccount,
    saveFont,
    addBGVideo,
    delBGVideo,
    updateSubtitleColor,
    updateReddit_Output,
    updateVidoesGenerated,
    lookupBGVideo,
    lookupVideo,
    setCustomerId,
    verifyAccount,
    updateVerificationCode,
    setResetPasswordCode,
    resetPassword,
    setVoice,
    delOutputVideo,
    setTikTok,
    updateBalanceLastUpdated
}