const stripe = require('stripe')(process.env.STRIPE_SK);
const mongo = require('./mongo')

const createCustomer = async (email, name) => {
    const customer = await stripe.customers.create({
        email,
        name,
    });
    return customer.id;
}


const createOneTimePayment = async (username, amount, currency) => {
    const account = await mongo.getAccount(username)
    var customerId = account.customerId || null;
    if (!account.customerId) {
        customerId = await createCustomer(account.email, account.username)
        await mongo.setCustomerId(customerId, account.username)
    }


    try {
        var session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: currency.toLowerCase(),
                        product_data: {
                            name: 'Credit',
                        },
                        unit_amount: amount,
                    },
                    quantity: 1,
                },
            ],
            allow_promotion_codes: true,
            customer: customerId,
            mode: 'payment',
            success_url: process.env.BASE_URL,
            cancel_url: process.env.BASE_URL,
        });
    } catch {
        return null
    }
    return session.url

}

const getBalance = async (username) => {
    const account = await mongo.getAccount(username)
    var customerId = account.customerId;

    if (!account.customerId) 0
    try {
        var customer = await stripe.customers.retrieve(
            customerId
        );
    } catch {
        return 0
    }

    return parseFloat(customer.metadata.balance)
}

const deductFromBalance = async (username, amount = 50) => {
    const account = await mongo.getAccount(username)
    var customerId = account.customerId;
    if (!account.customerId) 0

    try {
        var customer = await stripe.customers.retrieve(
            customerId
        );
        await stripe.customers.update(
            customerId,
            { metadata: { balance: parseFloat(customer.metadata.balance) - amount } }
        );
    } catch {
        return 0
    }

    return (parseFloat(customer?.metadata?.balance) - amount) || 0
}

module.exports = {
    createOneTimePayment,
    getBalance,
    deductFromBalance
}