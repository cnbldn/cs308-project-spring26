const mongoose = require('mongoose');
require('dotenv').config();
const Order = require('./models/Order');

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const order = await Order.findOne().sort({ createdAt: -1 });
        if (!order) {
            console.log('No orders found.');
        } else {
            console.log('Last Order ID:', order._id);
            console.log('Items sample:', order.items.map(i => ({ 
                name: i.name, 
                category: i.category, 
                lineTotal: i.lineTotal 
            })));
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkData();
