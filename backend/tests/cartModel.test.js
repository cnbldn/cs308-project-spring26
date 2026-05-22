const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Cart = require('../models/Cart');

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

describe('Cart Model Unit Tests', () => {
    const mockProductId = new mongoose.Types.ObjectId();
    const mockCustomerId = new mongoose.Types.ObjectId();

    it('should calculate cartTotal automatically on save', async () => {
        const cart = new Cart({
            customerId: mockCustomerId,
            items: [
                { product: mockProductId, quantity: 2, price: 50 },
                { product: new mongoose.Types.ObjectId(), quantity: 1, price: 30 }
            ]
        });
        const saved = await cart.save();
        expect(saved.cartTotal).toBe(130);
    });

    it('should add item using addItem method', async () => {
        const cart = await Cart.findOne({ customerId: mockCustomerId });
        const newProdId = new mongoose.Types.ObjectId();
        await cart.addItem(newProdId, 1, 20);
        expect(cart.items.length).toBe(3);
        expect(cart.cartTotal).toBe(150);
    });

    it('should increment quantity if same item is added', async () => {
        const cart = await Cart.findOne({ customerId: mockCustomerId });
        await cart.addItem(mockProductId, 1, 50);
        expect(cart.items.length).toBe(3); // Still 3 unique products
        const item = cart.items.find(i => i.product.equals(mockProductId));
        expect(item.quantity).toBe(3); // 2 (initial) + 1
        expect(cart.cartTotal).toBe(200);
    });

    it('should remove item using removeItem method', async () => {
        const cart = await Cart.findOne({ customerId: mockCustomerId });
        await cart.removeItem(mockProductId);
        expect(cart.items.length).toBe(2);
        expect(cart.cartTotal).toBe(50);
    });

    it('should update quantity using updateQuantity method', async () => {
        const cart = await Cart.findOne({ customerId: mockCustomerId });
        const item = cart.items[0];
        await cart.updateQuantity(item.product, 5);
        expect(cart.items[0].quantity).toBe(5);
    });
});
