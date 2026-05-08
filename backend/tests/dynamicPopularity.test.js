const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const Product = require('../models/Product');
const Rating = require('../models/Rating');
const Cart = require('../models/Cart');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const Invoice = require('../models/Invoice');
const express = require('express');
const request = require('supertest');
const orderRoutes = require('../routes/orders');
const reviewRoutes = require('../routes/reviews');

// Mock email service
jest.mock('../utils/emailService', () => ({
    sendInvoiceEmail: jest.fn().mockResolvedValue({ messageId: 'mock-id' })
}));

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
    app.use('/api/reviews', reviewRoutes);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Dynamic Popularity Logic', () => {
    let testProduct;
    let testCustomer;

    beforeEach(async () => {
        await Product.deleteMany({});
        await Rating.deleteMany({});
        await Cart.deleteMany({});
        await Customer.deleteMany({});
        await Order.deleteMany({});

        testProduct = new Product({
            name: 'Popular Game',
            description: 'A very popular game',
            model: 'P1',
            serialNumber: 'SN-POP',
            price: 50,
            stock: 100,
            category: 'Action',
            distributorInfo: { name: 'Dist' },
            popularity: 10
        });
        await testProduct.save();

        testCustomer = new Customer({
            name: 'Test Customer',
            email: 'test@example.com',
            password: 'hashedpassword',
            homeAddress: '123 Test St'
        });
        await testCustomer.save();
    });

    it('should increment popularity on checkout', async () => {
        // 1. Setup a cart for the customer
        const cart = new Cart({
            customerId: testCustomer._id,
            items: [{ product: testProduct._id, quantity: 2, price: 50 }]
        });
        await cart.save();

        // 2. Perform checkout
        const response = await request(app)
            .post('/api/orders/checkout')
            .send({
                customerId: testCustomer._id,
                deliveryAddress: '123 Street',
                billingEmail: 'test@example.com'
            });

        expect(response.status).toBe(201); // Wait, what is the status code? 
        // Let's check backend/routes/orders.js checkout status code.
        
        const updatedProduct = await Product.findById(testProduct._id);
        // Original popularity: 10
        // Quantity: 2
        // Increment: 2 * 5 = 10
        // Expected: 20
        expect(updatedProduct.popularity).toBe(20);
    });

    it('should increment popularity on rating', async () => {
        // Perform rating
        const response = await request(app)
            .post('/api/reviews/rate')
            .send({
                productId: testProduct._id,
                customerId: testCustomer._id,
                value: 5
            });

        expect(response.status).toBe(200);
        
        const updatedProduct = await Product.findById(testProduct._id);
        // Original popularity: 10
        // Increment: 3
        // Expected: 13
        expect(updatedProduct.popularity).toBe(13);
    });
});
