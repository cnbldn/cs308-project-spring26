const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Rating = require('../models/Rating');

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

module.exports = router;
