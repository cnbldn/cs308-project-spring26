const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Product = require('../models/Product');

/**
 * @route GET /api/wishlist/:customerId
 * @desc Get user's wishlist
 */
router.get('/:customerId', async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.customerId)
            .populate('wishlist.product');
        
        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        res.status(200).json(customer.wishlist);
    } catch (err) {
        console.error("[WISHLIST] Error fetching wishlist:", err);
        res.status(500).json({ message: err.message });
    }
});

/**
 * @route POST /api/wishlist/:customerId/add
 * @desc Add a product to the wishlist
 */
router.post('/:customerId/add', async (req, res) => {
    try {
        const { productId } = req.body;
        if (!productId) {
            return res.status(400).json({ message: "Product ID is required" });
        }

        const customer = await Customer.findById(req.params.customerId);
        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Check if already in wishlist
        const alreadyInWishlist = customer.wishlist.some(
            item => item.product.toString() === productId
        );

        if (alreadyInWishlist) {
            return res.status(400).json({ message: "Product already in wishlist" });
        }

        customer.wishlist.push({ product: productId });
        await customer.save();

        // Return the populated wishlist item or just success
        res.status(200).json({ message: "Product added to wishlist", wishlist: customer.wishlist });
    } catch (err) {
        console.error("[WISHLIST] Error adding to wishlist:", err);
        res.status(500).json({ message: err.message });
    }
});

/**
 * @route DELETE /api/wishlist/:customerId/remove/:productId
 * @desc Remove a product from the wishlist
 */
router.delete('/:customerId/remove/:productId', async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.customerId);
        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        const initialLength = customer.wishlist.length;
        customer.wishlist = customer.wishlist.filter(
            item => item.product.toString() !== req.params.productId
        );

        if (customer.wishlist.length === initialLength) {
            return res.status(404).json({ message: "Product not found in wishlist" });
        }

        await customer.save();
        res.status(200).json({ message: "Product removed from wishlist", wishlist: customer.wishlist });
    } catch (err) {
        console.error("[WISHLIST] Error removing from wishlist:", err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
