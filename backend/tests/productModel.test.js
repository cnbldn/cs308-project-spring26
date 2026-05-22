const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Product = require('../models/Product');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Product Model Unit Tests', () => {
    it('should create a valid product', async () => {
        const validProduct = new Product({
            name: 'Test Game',
            description: 'A test description',
            model: 'X1',
            serialNumber: 'SN-001',
            price: 59.99,
            stock: 10,
            category: 'Action',
            distributorInfo: {
                name: 'Test Dist',
                contactEmail: 'dist@test.com',
                country: 'TestLand'
            }
        });
        const savedProduct = await validProduct.save();
        expect(savedProduct._id).toBeDefined();
        expect(savedProduct.name).toBe('Test Game');
    });

    it('should fail if required fields are missing', async () => {
        const productWithoutName = new Product({
            description: 'No name'
        });
        let err;
        try {
            await productWithoutName.save();
        } catch (error) {
            err = error;
        }
        expect(err).toBeDefined();
        expect(err.errors.name).toBeDefined();
    });

    it('should fail if price is negative', async () => {
        const negativePriceProduct = new Product({
            name: 'Cheap Game',
            description: 'Free?',
            model: 'M1',
            serialNumber: 'SN-NEG',
            price: -10,
            stock: 5,
            category: 'Action',
            distributorInfo: { name: 'D1' }
        });
        let err;
        try {
            await negativePriceProduct.save();
        } catch (error) {
            err = error;
        }
        expect(err).toBeDefined();
        expect(err.errors.price).toBeDefined();
    });

    it('should enforce unique serial numbers', async () => {
        const p1 = new Product({
            name: 'Game 1',
            description: 'Desc',
            model: 'M1',
            serialNumber: 'DUPE-123',
            price: 10,
            stock: 5,
            category: 'Action',
            distributorInfo: { name: 'D1' }
        });
        await p1.save();

        const p2 = new Product({
            name: 'Game 2',
            description: 'Desc',
            model: 'M2',
            serialNumber: 'DUPE-123',
            price: 20,
            stock: 5,
            category: 'Action',
            distributorInfo: { name: 'D1' }
        });

        let err;
        try {
            await p2.save();
        } catch (error) {
            err = error;
        }
        expect(err).toBeDefined();
        expect(err.code).toBe(11000); // MongoDB duplicate key error code
    });
});
