const { getCollection, updateBalanceLastUpdated } = require('./mongo')
const { updateCustomerBalance } = require('../routes/stripe_handler')


const FREE_CREDITS = 100

// Function to apply credits to accounts daily (free credits)
const creditHandler = async () => {
    try {
        var accountsCursor = await getCollection('accounts');
        const accounts = await accountsCursor.find({}).toArray();

        for (const account of accounts) {
            const now = Date.now()
            const last_updated_balance = account.balanceLastUpdated || null
            const customer_id = account.customerId
            const username = account.username

            if (last_updated_balance) {
                const last_updated_balance_date = new Date(last_updated_balance)

                const diff = Math.abs(now - last_updated_balance_date)
                const hours = Math.ceil(diff / (1000 * 60 * 60))
                if (hours >= 24) {
                    await updateCustomerBalance(customer_id, FREE_CREDITS, 0)
                    await updateBalanceLastUpdated(username, now)
                }
            } else {
                await updateCustomerBalance(customer_id, FREE_CREDITS, 0)
                await updateBalanceLastUpdated(username, now)
            }


        }
    } catch (err) {
        console.error('Error:', err);
    }
};

creditHandler();

// Run the function every 30 minutes
setInterval(creditHandler, 1000 * 60 * 30);

module.exports = creditHandler;