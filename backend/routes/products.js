const express = require('express');
const router = express.Router();

// Mock Product List for the Landing Page
// This fulfills Requirement #1 (Products/Categories) for the Demo
router.get('/', (req, res) => {
    const mockProducts = [
        {
            id: 'p1',
            name: 'Gaming Laptop',
            category: 'Electronics',
            price: 1200,
            stock: 5,
            image: 'https://via.placeholder.com/300'
        },
        {
            id: 'p2',
            name: 'Classic White Tee',
            category: 'Clothing',
            price: 25,
            stock: 50,
            image: 'https://via.placeholder.com/300'
        },
        {
            id: 'p3',
            name: 'Bluetooth Headphones',
            category: 'Electronics',
            price: 150,
            stock: 12,
            image: 'https://via.placeholder.com/300'
        }
    ];

    res.status(200).json(mockProducts);
});

module.exports = router;
