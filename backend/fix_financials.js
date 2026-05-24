const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/Product');
const Order = require('./models/Order');

async function fixData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Fix Products missing costPrice
        const products = await Product.find({ costPrice: { $exists: false } });
        console.log(`Found ${products.length} products to fix.`);
        for (const p of products) {
            p.costPrice = Number((p.price * 0.6).toFixed(2));
            await p.save();
        }

        // 2. Fix Orders missing unitCost or category in items
        const orders = await Order.find();
        let fixedOrders = 0;
        for (const order of orders) {
            let modified = false;
            for (const item of order.items) {
                if (item.unitCost === undefined || item.unitCost === null) {
                    item.unitCost = Number((item.unitPrice * 0.6).toFixed(2));
                    modified = true;
                }
                if (!item.category) {
                    const product = await Product.findById(item.product);
                    item.category = product ? product.category : 'Other';
                    modified = true;
                }
            }
            if (modified) {
                await order.save();
                fixedOrders++;
            }
        }
        console.log(`Fixed ${fixedOrders} orders.`);

        console.log('Data fix complete.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixData();
