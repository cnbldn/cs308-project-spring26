const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// ADD TO CART (Fulfills Req #4: Guest support)
// POST /api/cart/add
router.post('/add', async (req, res) => {
  try {
    const { productId, quantity, customerId, sessionId } = req.body;

    // 1. Find the product and check stock (Req #3)
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: `Insufficient stock. Only ${product.stock} items left.` });
    }

    // 2. Find or create the user's cart (Check customerId first, then sessionId)
    let cart;
    if (customerId) {
      cart = await Cart.findOne({ customerId: customerId });
    } else if (sessionId) {
      cart = await Cart.findOne({ sessionId: sessionId, customerId: null });
    }

    if (!cart) {
      cart = new Cart({ 
        customerId: customerId || null, 
        sessionId: customerId ? null : sessionId,
        items: [], 
        cartTotal: 0 
      });
    }

    // 3. Update items (using the addItem method from the model for cleanliness)
    const itemIndex = cart.items.findIndex(p => p.product.toString() === productId);
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity: quantity, price: product.price });
    }

    // Note: The cartTotal is automatically updated by the pre-save hook in Cart.js!
    await cart.save();
    res.status(200).json({ message: "Item added to cart", cart });

  } catch (err) {
    console.error("Cart error:", err);
    res.status(500).json({ message: err.message });
  }
});

// REMOVE ITEM FROM CART
// DELETE /api/cart/:id/:productId (id can be customerId or sessionId)
router.delete('/:id/:productId', async (req, res) => {
  try {
    const { id, productId } = req.params;

    const cart = await Cart.findOne({ 
      $or: [{ customerId: id }, { sessionId: id }] 
    });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );

    await cart.save();
    res.status(200).json({ message: "Item removed from cart", cart });
  } catch (err) {
    console.error("Cart remove error:", err);
    res.status(500).json({ message: err.message });
  }
});

// GET USER OR GUEST CART
// GET /api/cart/:id (id can be customerId or sessionId)
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    let cart;

    // 1. Check if ID is a valid MongoDB ObjectId
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);

    if (isValidObjectId) {
      // Try searching by customerId first
      cart = await Cart.findOne({ customerId: id }).populate('items.product');
    }

    // 2. If no cart found by customerId, search by sessionId
    if (!cart) {
      cart = await Cart.findOne({ sessionId: id }).populate('items.product');
    }

    if (!cart) {
      return res.status(200).json({ items: [], cartTotal: 0 });
    }

    // Drop ghost items (product deleted from DB) so the stored cartTotal
    // doesn't keep charging the user for products that no longer exist.
    const originalLength = cart.items.length;
    cart.items = cart.items.filter((item) => item.product);
    if (cart.items.length !== originalLength) {
      await cart.save();
    }

    res.json(cart);
  } catch (err) {
    console.error("Get cart error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
