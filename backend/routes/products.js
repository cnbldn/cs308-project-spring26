const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

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
        res.status(200).json(products);
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

module.exports = router;
