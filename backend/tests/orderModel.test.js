const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Order = require('../models/Order');

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

describe('Order Model Unit Tests', () => {
    const mockCustomerId = new mongoose.Types.ObjectId();
    const mockProductId = new mongoose.Types.ObjectId();

    it('should calculate totalAmount from subtotal by default', async () => {
        const order = new Order({
            customer: mockCustomerId,
            items: [{
                product: mockProductId,
                name: 'Game A',
                model: 'M1',
                serialNumber: 'SN1',
                quantity: 1,
                unitPrice: 50,
                lineTotal: 50
            }],
            subtotal: 50,
            deliveryAddress: 'Test Address'
        });
        const saved = await order.save();
        expect(saved.totalAmount).toBe(50);
        expect(saved.orderStatus).toBe('processing');
    });

    it('should maintain status history', async () => {
        const order = await Order.findOne({ customer: mockCustomerId });
        expect(order.statusHistory.length).toBe(1);
        expect(order.statusHistory[0].status).toBe('processing');
    });

    it('should fail if items are empty', async () => {
        const emptyOrder = new Order({
            customer: mockCustomerId,
            items: [],
            subtotal: 0,
            deliveryAddress: 'Addr'
        });
        let err;
        try {
            await emptyOrder.save();
        } catch (error) {
            err = error;
        }
        expect(err).toBeDefined();
    });

    it('should only allow valid statuses', async () => {
        const order = await Order.findOne({ customer: mockCustomerId });
        order.orderStatus = 'invalid-status';
        let err;
        try {
            await order.save();
        } catch (error) {
            err = error;
        }
        expect(err).toBeDefined();
        expect(err.errors.orderStatus).toBeDefined();
    });
});
