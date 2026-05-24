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
    // We need a Replica Set for transactions
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

describe('Order Cancellation API Integration Tests', () => {
    let testProduct;
    let testCustomer;
    let testOrder;

    beforeEach(async () => {
        await Product.deleteMany({});
        await Customer.deleteMany({});
        await Order.deleteMany({});

        testProduct = new Product({
            name: 'Cancellable Game',
            description: 'Test Description',
            model: 'C1',
            serialNumber: 'SN-CANCEL',
            price: 60,
            stock: 10,
            category: 'Action',
            distributorInfo: { name: 'Dist' }
        });
        await testProduct.save();

        testCustomer = new Customer({
            name: 'Test User',
            email: 'cancel@test.com',
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
                quantity: 2,
                unitPrice: 60,
                lineTotal: 120
            }],
            subtotal: 120,
            totalAmount: 120,
            deliveryAddress: '123 Test St',
            orderStatus: 'processing'
        });
        await testOrder.save();
    });

    it('should cancel a processing order and return stock', async () => {
        const res = await request(app)
            .patch(`/api/orders/${testOrder._id}/cancel`);

        expect(res.status).toBe(200);
        expect(res.body.order.orderStatus).toBe('cancelled');
        expect(res.body.order.statusHistory).toContainEqual(
            expect.objectContaining({ status: 'cancelled' })
        );

        const updatedProduct = await Product.findById(testProduct._id);
        // Initial 10, should be 12 after returning 2
        expect(updatedProduct.stock).toBe(12);
    });

    it('should not cancel an order that is already in-transit', async () => {
        testOrder.orderStatus = 'in-transit';
        await testOrder.save();

        const res = await request(app)
            .patch(`/api/orders/${testOrder._id}/cancel`);

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('already in-transit');

        const product = await Product.findById(testProduct._id);
        expect(product.stock).toBe(10); // No change
    });

    it('should return 404 for non-existent order', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .patch(`/api/orders/${fakeId}/cancel`);

        expect(res.status).toBe(404);
    });
});
