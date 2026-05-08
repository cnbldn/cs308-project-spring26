const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Customer = require('../models/Customer');

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

describe('Customer Model Unit Tests', () => {
    it('should hash the password before saving', async () => {
        const customer = new Customer({
            name: 'Hash Test',
            email: 'hash@test.com',
            password: 'secretpassword',
            taxId: 'TX-001',
            homeAddress: '123 Test St'
        });
        const savedCustomer = await customer.save();
        expect(savedCustomer.password).not.toBe('secretpassword');
        expect(savedCustomer.password.length).toBeGreaterThan(20);
    });

    it('should correctly compare passwords', async () => {
        const customer = await Customer.findOne({ email: 'hash@test.com' }).select('+password');
        const isMatch = await customer.comparePassword('secretpassword');
        const isNotMatch = await customer.comparePassword('wrongpassword');
        expect(isMatch).toBe(true);
        expect(isNotMatch).toBe(false);
    });

    it('should enforce unique emails', async () => {
        const c2 = new Customer({
            name: 'Dupe Test',
            email: 'hash@test.com',
            password: 'password123',
            taxId: 'TX-002',
            homeAddress: '456 Test St'
        });
        let err;
        try {
            await c2.save();
        } catch (error) {
            err = error;
        }
        expect(err).toBeDefined();
        expect(err.code).toBe(11000);
    });

    it('should default role to customer', async () => {
        const c3 = new Customer({
            name: 'Role Test',
            email: 'role@test.com',
            password: 'password123',
            taxId: 'TX-003',
            homeAddress: '789 Test St'
        });
        const saved = await c3.save();
        expect(saved.role).toBe('customer');
    });
});
