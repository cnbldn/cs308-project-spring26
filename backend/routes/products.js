const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Rating = require('../models/Rating');
const Customer = require('../models/Customer');

const attachRatings = async (products) => {
    const ids = products.map((p) => p._id);
    const aggs = await Rating.aggregate([
        { $match: { product: { $in: ids } } },
        { $group: { _id: '$product', avg: { $avg: '$value' }, count: { $sum: 1 } } }
    ]);
    const map = new Map(
        aggs.map((r) => [String(r._id), { avg: Number(r.avg.toFixed(1)), count: r.count }])
    );
    return products.map((p) => {
        const obj = p.toObject ? p.toObject() : p;
        const r = map.get(String(obj._id));
        return {
            ...obj,
            averageRating: r ? r.avg : 0,
            totalRatings: r ? r.count : 0
        };
    });
};

// GET ALL PRODUCTS
// Supports search, category filtering, and sorting (Requirement #1 & #7)
router.get('/', async (req, res) => {
    try {
        const { search, category, sort } = req.query;
        let query = {};

        // 1. Search Logic (Name or Description)
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // 2. Category Filtering
        if (category) {
            query.category = category;
        }

        let apiQuery = Product.find(query);

        // 3. Sorting Logic
        if (sort) {
            if (sort === 'price_asc') {
                apiQuery = apiQuery.sort({ price: 1 });
            } else if (sort === 'price_desc') {
                apiQuery = apiQuery.sort({ price: -1 });
            } else if (sort === 'popularity') {
                apiQuery = apiQuery.sort({ popularity: -1 });
            }
        } else {
            // Default sort (e.g., newest)
            apiQuery = apiQuery.sort({ createdAt: -1 });
        }

        const products = await apiQuery;
        const enriched = await attachRatings(products);
        res.status(200).json(enriched);
    } catch (err) {
        console.error("Error fetching products:", err);
        res.status(500).json({ message: "Failed to fetch products" });
    }
});

// GET UNIQUE CATEGORIES
// Used to populate the sidebar (Requirement #1)
router.get('/categories', async (req, res) => {
    try {
        const categories = await Product.distinct('category');
        res.status(200).json(categories);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch categories" });
    }
});

// GET ACTIVE DEALS
// Returns products whose discount is currently live (Requirement #11 — customer-facing).
// Filters: discountRate > 0, discountStart <= now (or null), discountEnd >= now (or null).
router.get('/deals', async (req, res) => {
    try {
        const { category, sort } = req.query;
        const now = new Date();

        const query = {
            discountRate: { $gt: 0 },
            $and: [
                { $or: [{ discountStart: null }, { discountStart: { $lte: now } }] },
                { $or: [{ discountEnd: null }, { discountEnd: { $gte: now } }] }
            ]
        };

        if (category) query.category = category;

        let apiQuery = Product.find(query);

        if (sort === 'price_asc') {
            apiQuery = apiQuery.sort({ price: 1 });
        } else if (sort === 'price_desc') {
            apiQuery = apiQuery.sort({ price: -1 });
        } else if (sort === 'ending_soon') {
            // Mongo sorts nulls first in ascending; we re-sort below to push them last.
            apiQuery = apiQuery.sort({ discountEnd: 1 });
        } else {
            // Default: biggest discount first
            apiQuery = apiQuery.sort({ discountRate: -1 });
        }

        let products = await apiQuery;

        if (sort === 'ending_soon') {
            products = [...products].sort((a, b) => {
                const aEnd = a.discountEnd ? a.discountEnd.getTime() : Infinity;
                const bEnd = b.discountEnd ? b.discountEnd.getTime() : Infinity;
                return aEnd - bEnd;
            });
        }

        const enriched = await attachRatings(products);
        res.status(200).json(enriched);
    } catch (err) {
        console.error("Error fetching deals:", err);
        res.status(500).json({ message: "Failed to fetch deals" });
    }
});

// GET CATEGORIES THAT HAVE ACTIVE DEALS
// Lets the Deals sidebar show only categories with live discounts.
router.get('/deals/categories', async (req, res) => {
    try {
        const now = new Date();
        const categories = await Product.distinct('category', {
            discountRate: { $gt: 0 },
            $and: [
                { $or: [{ discountStart: null }, { discountStart: { $lte: now } }] },
                { $or: [{ discountEnd: null }, { discountEnd: { $gte: now } }] }
            ]
        });
        res.status(200).json(categories);
    } catch (err) {
        console.error("Error fetching deal categories:", err);
        res.status(500).json({ message: "Failed to fetch deal categories" });
    }
});

// GET PRODUCT BY ID
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });
        res.status(200).json(product);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PATCH STOCK (Product Manager - Req #12)
// PATCH /api/products/:id/stock
router.patch('/:id/stock', async (req, res) => {
    try {
        const { stock } = req.body;

        if (typeof stock !== 'number' || !Number.isInteger(stock) || stock < 0) {
            return res.status(400).json({ message: "Stock must be a non-negative integer." });
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { stock },
            { new: true, runValidators: true }
        );

        if (!product) return res.status(404).json({ message: "Product not found" });
        res.status(200).json({ message: "Stock updated successfully.", product });
    } catch (err) {
        console.error("Stock update error:", err);
        res.status(500).json({ message: err.message });
    }
});

/**
 * @route PATCH /api/products/:id/price
 * @desc Update product basePrice and/or discountRate (Sales Manager - Req #11)
 */
router.patch('/:id/price', async (req, res) => {
    try {
        const { basePrice, discountRate } = req.body;
        const productId = req.params.id;

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: "Product not found" });

        const oldDiscountRate = product.discountRate;

        if (basePrice !== undefined) product.basePrice = basePrice;
        if (discountRate !== undefined) product.discountRate = discountRate;

        // The pre('validate') hook in Product.js handles computing price/discountedPrice
        await product.save();

        // Notify users if a discount was added/increased (Requirement #11)
        if (discountRate > 0 && discountRate > oldDiscountRate) {
            const customers = await Customer.find({ "wishlist.product": productId });
            
            const notificationPromises = customers.map(customer => {
                customer.notifications.push({
                    type: 'wishlist_discount',
                    title: 'Price Drop Alert!',
                    message: `A product in your wishlist, "${product.name}", is now ${product.discountRate}% off!`,
                    product: product._id
                });
                return customer.save();
            });

            await Promise.all(notificationPromises);
            console.log(`[DISCOUNT] Notified ${customers.length} users about discount on ${product.name}`);
        }

        res.status(200).json({ 
            message: "Pricing updated successfully.", 
            product,
            notifiedCount: (discountRate > 0 && discountRate > oldDiscountRate) ? (await Customer.countDocuments({ "wishlist.product": productId })) : 0
        });
    } catch (err) {
        console.error("[PRICE UPDATE ERROR]", err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
