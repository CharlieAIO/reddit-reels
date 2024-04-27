const stripe = require('stripe')(process.env.STRIPE_SK);

const updateCustomerBalance = async (customer, amount, attempts) => {
    try {
        if (attempts > 5) {
            console.log('too many attempts')
            return
        }
        const customerData = await stripe.customers.retrieve(customer);
        const existingBalance = customerData.metadata.balance || 0;

        // Calculate the new balance
        const newBalance = parseFloat(existingBalance) + amount;

        await stripe.customers.update(
            customer,
            { metadata: { balance: newBalance } }
        );

    } catch (e) {
        console.log(e)
        return await updateCustomerBalance(customer, amount, attempts + 1)
    }

    return
}


const stripe_handler = async (req, res) => {
    try {
        const sig = req.headers['stripe-signature'];

        try {
            var event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        } catch (err) {
            console.log(`⚠️  Webhook signature verification failed.`);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        res.send({ received: true });

        if (event.type === 'checkout.session.completed') {
            console.log(`🔔  Payment received!`);
            const session = event.data.object;
            const { status, customer, amount_subtotal } = session
            await updateCustomerBalance(customer, amount_subtotal, 0)

        }


    } catch (e) { console.log(e) }
};

module.exports = {
    updateCustomerBalance,
    stripe_handler
}
