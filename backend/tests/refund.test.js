const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const express = require('express');
const request = require('supertest');
const orderRoutes = require('../routes/orders');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

let mongoServer;
let app;

beforeAll(async () => {
    mongoServer = await MongoMemoryReplSet.create({
        replSet: { storageEngine: 'wiredTiger' }
    });
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    app = express();
    app.use(express.json());
    app.use('/api/orders', orderRoutes);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Refund & Return API Integration Tests', () => {
    let testProduct;
    let testCustomer;
    let testOrder;

    beforeEach(async () => {
        await Product.deleteMany({});
        await Customer.deleteMany({});
        await Order.deleteMany({});

        testProduct = new Product({
            name: 'Returnable Game',
            description: 'Test Description',
            model: 'R1',
            serialNumber: 'SN-RETURN',
            price: 50,
            stock: 10,
            category: 'Action',
            distributorInfo: { name: 'Dist' }
        });
        await testProduct.save();

        testCustomer = new Customer({
            name: 'Buyer',
            email: 'buyer@test.com',
            password: 'password123',
            homeAddress: '123 Test St'
        });
        await testCustomer.save();

        testOrder = new Order({
            customer: testCustomer._id,
            items: [{
                product: testProduct._id,
                name: testProduct.name,
                model: testProduct.model,
                serialNumber: testProduct.serialNumber,
                quantity: 1,
                unitPrice: 50,
                lineTotal: 50
            }],
            subtotal: 50,
            totalAmount: 50,
            deliveryAddress: '123 Test St',
            orderStatus: 'delivered', // Must be delivered to return
            placedAt: new Date()
        });
        await testOrder.save();
    });

    it('should submit a return request successfully', async () => {
        const res = await request(app)
            .post(`/api/orders/${testOrder._id}/return-request`)
            .send({
                productId: testProduct._id,
                quantity: 1,
                reason: 'Defective'
            });

        expect(res.status).toBe(200);
        expect(res.body.order.items[0].returnStatus).toBe('requested');
    });

    it('should authorize refund, update stock, and notify customer', async () => {
        // First request it
        await request(app)
            .post(`/api/orders/${testOrder._id}/return-request`)
            .send({ productId: testProduct._id, quantity: 1 });

        // Then authorize it
        const res = await request(app)
            .patch(`/api/orders/${testOrder._id}/process-return`)
            .send({
                productId: testProduct._id,
                action: 'refunded'
            });

        expect(res.status).toBe(200);
        expect(res.body.order.items[0].returnStatus).toBe('refunded');
        expect(res.body.order.items[0].refundAmount).toBe(50);

        // Verify stock increment
        const product = await Product.findById(testProduct._id);
        expect(product.stock).toBe(11); // 10 + 1

        // Verify notification
        const customer = await Customer.findById(testCustomer._id);
        expect(customer.notifications.length).toBe(1);
        expect(customer.notifications[0].type).toBe('refund_update');
    });

    it('should reject return if past 30 days', async () => {
        testOrder.placedAt = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000); // 31 days ago
        await testOrder.save();

        const res = await request(app)
            .post(`/api/orders/${testOrder._id}/return-request`)
            .send({ productId: testProduct._id, quantity: 1 });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('30 days');
    });
});
