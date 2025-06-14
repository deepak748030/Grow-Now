import cron from 'node-cron';
import moment from 'moment-timezone';
import SubscriptionOrder from '../models/SubscriptionOrders.js';

// Cron job: runs daily at 11:20 PM IST
cron.schedule('20 23 * * *', async () => {
    try {
        const now = moment().tz('Asia/Kolkata').startOf('day').toDate();

        // Find orders where any orders.startDate is before today, paymentType is COD, and subscriptionStatus is not already 'Cancelled'
        const orders = await SubscriptionOrder.find({
            paymentType: 'COD',
            subscriptionStatus: { $ne: 'Cancelled' },
            'orders.startDate': { $lt: now }
        });

        for (const order of orders) {
            let orderModified = false;
            order.subscriptionStatus = 'Cancelled';

            // Update deliveryDates.status to "Failed" for all relevant subOrders
            for (const [i, subOrder] of order.orders.entries()) {
                if (subOrder.startDate < now) {
                    let subOrderModified = false;
                    for (const [j, deliveryDate] of subOrder.deliveryDates.entries()) {
                        if (deliveryDate.status !== 'Failed') {
                            order.orders[i].deliveryDates[j].status = 'Failed';
                            subOrderModified = true;
                        }
                    }
                    if (subOrderModified) {
                        order.markModified(`orders.${i}.deliveryDates`);
                        orderModified = true;
                    }
                }
            }

            if (orderModified || order.isModified('subscriptionStatus')) {
                await order.save();
            }
        }

        console.log(`[${new Date().toISOString()}] Subscription COD orders updated to Cancelled and deliveryDates set to Failed if any startDate is before today.`);
    } catch (error) {
        console.error('Error updating subscription orders:', error);
    }
}, {
    timezone: 'Asia/Kolkata'
});