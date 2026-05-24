const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const request = require('supertest');
const productRoutes = require('../routes/products');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

let mongoServer;
let app;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    app = express();
    app.use(express.json());
    app.use('/api/products', productRoutes);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Discount & Pricing API Integration Tests', () => {
    let testProduct;
    let testCustomer;

    beforeEach(async () => {
        await Product.deleteMany({});
        await Customer.deleteMany({});

        testProduct = new Product({
            name: 'Discount Game',
            description: 'A game to be discounted',
            model: 'D1',
            serialNumber: 'SN-DISC',
            price: 100,
            stock: 10,
            category: 'Action',
            distributorInfo: { name: 'Dist' }
        });
        await testProduct.save();

        testCustomer = new Customer({
            name: 'Wishlist User',
            email: 'wish@test.com',
            password: 'password123',
            homeAddress: '123 Test St',
            wishlist: [{ product: testProduct._id }]
        });
        await testCustomer.save();
    });

    it('should update basePrice and calculate price', async () => {
        const res = await request(app)
            .patch(`/api/products/${testProduct._id}/price`)
            .send({ basePrice: 200 });

        expect(res.status).toBe(200);
        expect(res.body.product.basePrice).toBe(200);
        expect(res.body.product.price).toBe(200);
    });

    it('should apply discount and notify wishlist users', async () => {
        const res = await request(app)
            .patch(`/api/products/${testProduct._id}/price`)
            .send({ discountRate: 20 });

        expect(res.status).toBe(200);
        expect(res.body.product.discountRate).toBe(20);
        expect(res.body.product.price).toBe(80); // 100 * 0.8
        expect(res.body.product.discountedPrice).toBe(80);

        // Verify notification
        const updatedCustomer = await Customer.findById(testCustomer._id);
        expect(updatedCustomer.notifications.length).toBe(1);
        expect(updatedCustomer.notifications[0].type).toBe('wishlist_discount');
        expect(updatedCustomer.notifications[0].message).toContain('20% off');
    });

    it('should not notify if discountRate is decreased', async () => {
        // First set it to 20%
        testProduct.discountRate = 20;
        await testProduct.save();

        const res = await request(app)
            .patch(`/api/products/${testProduct._id}/price`)
            .send({ discountRate: 10 });

        expect(res.status).toBe(200);
        expect(res.body.product.discountRate).toBe(10);
        
        const updatedCustomer = await Customer.findById(testCustomer._id);
        expect(updatedCustomer.notifications.length).toBe(0);
    });
});
