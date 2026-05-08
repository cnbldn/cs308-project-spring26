const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Invoice = require('../models/Invoice');

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

describe('Invoice Model Unit Tests', () => {
    const mockId = new mongoose.Types.ObjectId();

    it('should create a valid invoice', async () => {
        const invoice = new Invoice({
            invoiceNumber: 'INV-TEST-001',
            order: mockId,
            customer: mockId,
            billingEmail: 'test@billing.com',
            billingAddress: '123 Billing St',
            items: [{
                product: mockId,
                name: 'Item 1',
                model: 'Mod1',
                serialNumber: 'S1',
                quantity: 1,
                unitPrice: 100,
                lineTotal: 100
            }],
            subtotal: 100,
            totalAmount: 100
        });
        const saved = await invoice.save();
        expect(saved.invoiceNumber).toBe('INV-TEST-001');
        expect(saved.emailStatus).toBe('pending');
    });

    it('should lowercase the billing email', async () => {
        const invoice = new Invoice({
            invoiceNumber: 'INV-TEST-002',
            order: new mongoose.Types.ObjectId(),
            customer: mockId,
            billingEmail: 'UPPER@case.com',
            billingAddress: 'Addr',
            items: [{
                product: mockId,
                name: 'Item',
                model: 'M',
                serialNumber: 'S',
                quantity: 1,
                unitPrice: 10,
                lineTotal: 10
            }],
            subtotal: 10,
            totalAmount: 10
        });
        const saved = await invoice.save();
        expect(saved.billingEmail).toBe('upper@case.com');
    });

    it('should enforce unique invoice numbers', async () => {
        const i2 = new Invoice({
            invoiceNumber: 'INV-TEST-001', // Dupe
            order: new mongoose.Types.ObjectId(),
            customer: mockId,
            billingEmail: 'test2@billing.com',
            billingAddress: 'Addr',
            items: [{
                product: mockId,
                name: 'I',
                model: 'M',
                serialNumber: 'S',
                quantity: 1,
                unitPrice: 5,
                lineTotal: 5
            }],
            subtotal: 5,
            totalAmount: 5
        });
        let err;
        try {
            await i2.save();
        } catch (error) {
            err = error;
        }
        expect(err).toBeDefined();
        expect(err.code).toBe(11000);
    });

    it('should enforce unique order ID per invoice', async () => {
        const i3 = new Invoice({
            invoiceNumber: 'INV-TEST-003',
            order: mockId, // Used in first test
            customer: mockId,
            billingEmail: 'test3@billing.com',
            billingAddress: 'Addr',
            items: [{
                product: mockId,
                name: 'I',
                model: 'M',
                serialNumber: 'S',
                quantity: 1,
                unitPrice: 5,
                lineTotal: 5
            }],
            subtotal: 5,
            totalAmount: 5
        });
        let err;
        try {
            await i3.save();
        } catch (error) {
            err = error;
        }
        expect(err).toBeDefined();
        expect(err.code).toBe(11000);
    });
});
