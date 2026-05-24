const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const request = require('supertest');
const orderRoutes = require('../routes/orders');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Invoice = require('../models/Invoice');

let mongoServer;
let app;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
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

describe('Financials & Invoices API Integration Tests', () => {
    let testProduct;
    let customerId = new mongoose.Types.ObjectId();

    beforeEach(async () => {
        await Product.deleteMany({});
        await Order.deleteMany({});
        await Invoice.deleteMany({});

        testProduct = new Product({
            name: 'Profit Game',
            description: 'Test',
            model: 'P1',
            serialNumber: 'SN-PROFIT',
            price: 100,
            costPrice: 60,
            stock: 10,
            category: 'Action',
            distributorInfo: { name: 'Dist' }
        });
        await testProduct.save();

        const order = new Order({
            customer: customerId,
            items: [{
                product: testProduct._id,
                name: testProduct.name,
                model: testProduct.model,
                serialNumber: testProduct.serialNumber,
                quantity: 2,
                unitPrice: 100,
                unitCost: 60,
                lineTotal: 200
            }],
            subtotal: 200,
            totalAmount: 200,
            deliveryAddress: '123 Test St',
            placedAt: new Date('2026-05-15')
        });
        await order.save();

        const invoice = new Invoice({
            invoiceNumber: 'INV-TEST-001',
            order: order._id,
            customer: customerId,
            billingEmail: 'test@test.com',
            billingAddress: '123 Test St',
            items: order.items,
            subtotal: 200,
            totalAmount: 200,
            issuedAt: new Date('2026-05-15')
        });
        await invoice.save();
    });

    it('should calculate revenue and profit correctly', async () => {
        const res = await request(app).get('/api/orders/financials');

        expect(res.status).toBe(200);
        expect(res.body.totalRevenue).toBe(200);
        expect(res.body.totalCost).toBe(120); // 2 * 60
        expect(res.body.totalProfit).toBe(80); // 200 - 120
    });

    it('should filter financials by date range', async () => {
        // Range that excludes the order
        const resExclude = await request(app)
            .get('/api/orders/financials')
            .query({ startDate: '2026-05-16', endDate: '2026-05-20' });
        
        expect(resExclude.body.count).toBe(0);

        // Range that includes the order
        const resInclude = await request(app)
            .get('/api/orders/financials')
            .query({ startDate: '2026-05-01', endDate: '2026-05-31' });
        
        expect(resInclude.body.count).toBe(1);
        expect(resInclude.body.totalRevenue).toBe(200);
    });

    it('should list invoices by date range', async () => {
        const res = await request(app)
            .get('/api/orders/invoices-list')
            .query({ startDate: '2026-05-01', endDate: '2026-05-31' });

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].invoiceNumber).toBe('INV-TEST-001');
    });
});
