const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const request = require('supertest');
const wishlistRoutes = require('../routes/wishlist');
const Customer = require('../models/Customer');
const Product = require('../models/Product');

let mongoServer;
let app;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    app = express();
    app.use(express.json());
    app.use('/api/wishlist', wishlistRoutes);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Wishlist API Integration Tests', () => {
    let testProduct;
    let testCustomer;

    beforeEach(async () => {
        await Product.deleteMany({});
        await Customer.deleteMany({});

        testProduct = new Product({
            name: 'Wishlist Item',
            description: 'Item to be wishlisted',
            model: 'W1',
            serialNumber: 'SN-WISH',
            price: 100,
            stock: 10,
            category: 'Electronics',
            distributorInfo: { name: 'Distributor' }
        });
        await testProduct.save();

        testCustomer = new Customer({
            name: 'John Doe',
            email: 'john@example.com',
            password: 'password123',
            homeAddress: '123 Main St'
        });
        await testCustomer.save();
    });

    it('should add a product to the wishlist', async () => {
        const res = await request(app)
            .post(`/api/wishlist/${testCustomer._id}/add`)
            .send({ productId: testProduct._id });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Product added to wishlist");
        expect(res.body.wishlist.length).toBe(1);
        expect(res.body.wishlist[0].product).toBe(testProduct._id.toString());
    });

    it('should not add a duplicate product to the wishlist', async () => {
        await request(app)
            .post(`/api/wishlist/${testCustomer._id}/add`)
            .send({ productId: testProduct._id });

        const res = await request(app)
            .post(`/api/wishlist/${testCustomer._id}/add`)
            .send({ productId: testProduct._id });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Product already in wishlist");
    });

    it('should get the user\'s wishlist', async () => {
        await request(app)
            .post(`/api/wishlist/${testCustomer._id}/add`)
            .send({ productId: testProduct._id });

        const res = await request(app).get(`/api/wishlist/${testCustomer._id}`);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].product.name).toBe('Wishlist Item');
    });

    it('should remove a product from the wishlist', async () => {
        await request(app)
            .post(`/api/wishlist/${testCustomer._id}/add`)
            .send({ productId: testProduct._id });

        const res = await request(app)
            .delete(`/api/wishlist/${testCustomer._id}/remove/${testProduct._id}`);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Product removed from wishlist");
        expect(res.body.wishlist.length).toBe(0);
    });
});
