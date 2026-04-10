const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// ADD TO CART
// POST /api/cart/add
router.post('/add', async (req, res) => {
  try {
    const { productId, quantity, customerId } = req.body;

    // 1. Find the product and check stock (Req #3)
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: `Insufficient stock. Only ${product.stock} items left.` });
    }

    // 2. Find or create the user's cart
    // For now, we use customerId from the body (simplified for demo)
    let cart = await Cart.findOne({ customerId: customerId });
    if (!cart) {
      cart = new Cart({ customerId: customerId, items: [], cartTotal: 0 });
    }

    // 3. Update items
    const itemIndex = cart.items.findIndex(p => p.product.toString() === productId);
    if (itemIndex > -1) {
      // Product exists, update quantity
      cart.items[itemIndex].quantity += quantity;
      // Note: In a real app, you'd check stock again for the NEW total
    } else {
      // New product, add to cart
      cart.items.push({ product: productId, quantity: quantity, price: product.price });
    }

    // 4. Update cart total
    cart.cartTotal = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);

    await cart.save();
    res.status(200).json({ message: "Item added to cart", cart });

  } catch (err) {
    console.error("Cart error:", err);
    res.status(500).json({ message: err.message });
  }
});

// GET USER CART
router.get('/:customerId', async (req, res) => {
  try {
    const cart = await Cart.findOne({ customerId: req.params.customerId }).populate('items.product');
    if (!cart) return res.status(200).json({ items: [], cartTotal: 0 });
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
