const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Rating = require('../models/Rating');
const Product = require('../models/Product');

// SUBMIT A RATING (Requirement #5)
// POST /api/reviews/rate
router.post('/rate', async (req, res) => {
    try {
        const { productId, customerId, value } = req.body;

        if (!productId || !customerId || !value) {
            return res.status(400).json({ message: "Product, Customer, and Rating value are required." });
        }

        // Check if rating is between 1-5
        if (value < 1 || value > 5) {
            return res.status(400).json({ message: "Rating must be between 1 and 5." });
        }

        // Upsert rating (one rating per customer per product)
        const rating = await Rating.findOneAndUpdate(
            { product: productId, customer: customerId },
            { value: value },
            { new: true, upsert: true }
        );

        // Dynamic Popularity: Increment popularity for the product (Requirement #7 enhancement)
        await Product.findByIdAndUpdate(productId, { $inc: { popularity: 3 } });

        res.status(200).json({ message: "Rating submitted successfully.", rating });
    } catch (err) {
        console.error("Rating submission error:", err);
        res.status(500).json({ message: err.message });
    }
});

// SUBMIT A COMMENT (Requirement #5)
// POST /api/reviews/comment
router.post('/comment', async (req, res) => {
    try {
        const { productId, customerId, text } = req.body;

        if (!productId || !customerId || !text) {
            return res.status(400).json({ message: "Product, Customer, and Comment text are required." });
        }

        const comment = new Comment({
            product: productId,
            customer: customerId,
            text: text,
            status: 'pending' // Always starts as pending (Req #5)
        });

        await comment.save();
        res.status(201).json({ message: "Comment submitted and awaiting approval.", comment });
    } catch (err) {
        console.error("Comment submission error:", err);
        res.status(500).json({ message: err.message });
    }
});

// GET APPROVED COMMENTS AND AVERAGE RATING FOR A PRODUCT
// GET /api/reviews/product/:productId
router.get('/product/:productId', async (req, res) => {
    try {
        const { productId } = req.params;

        // 1. Fetch Approved Comments
        const comments = await Comment.find({ product: productId, status: 'approved' })
            .populate('customer', 'name')
            .sort({ createdAt: -1 });

        // 2. Fetch all ratings for this product to calculate average and enrich comments
        const ratings = await Rating.find({ product: productId });
        
        // Create a map for quick rating lookup by customerId
        const ratingMap = new Map();
        ratings.forEach(r => {
            ratingMap.set(r.customer.toString(), r.value);
        });

        const avgRating = ratings.length > 0 
            ? (ratings.reduce((acc, curr) => acc + curr.value, 0) / ratings.length).toFixed(1)
            : 0;

        // 3. Enrich comments with the specific rating given by that customer
        const enrichedComments = comments.map(c => {
            const commentObj = c.toObject();
            if (c.customer) {
                commentObj.customerRating = ratingMap.get(c.customer._id.toString()) || null;
            }
            return commentObj;
        });

        res.status(200).json({
            averageRating: parseFloat(avgRating),
            totalRatings: ratings.length,
            comments: enrichedComments
        });
    } catch (err) {
        console.error("Fetch reviews error:", err);
        res.status(500).json({ message: err.message });
    }
});

// GET PENDING COMMENTS (For Product Manager - Req #12)
// GET /api/reviews/pending
router.get('/pending', async (req, res) => {
    try {
        const pendingComments = await Comment.find({ status: 'pending' })
            .populate('product', 'name')
            .populate('customer', 'name')
            .sort({ createdAt: 1 });
        
        // Enrich pending comments with ratings
        const productIds = [...new Set(pendingComments.map(c => c.product?._id).filter(id => !!id))];
        const customerIds = [...new Set(pendingComments.map(c => c.customer?._id).filter(id => !!id))];

        const ratings = await Rating.find({
            product: { $in: productIds },
            customer: { $in: customerIds }
        });

        const ratingMap = new Map();
        ratings.forEach(r => {
            ratingMap.set(`${r.product.toString()}_${r.customer.toString()}`, r.value);
        });

        const enriched = pendingComments.map(c => {
            const obj = c.toObject();
            if (c.product && c.customer) {
                obj.customerRating = ratingMap.get(`${c.product._id.toString()}_${c.customer._id.toString()}`) || null;
            }
            return obj;
        });
        
        res.status(200).json(enriched);
    } catch (err) {
        console.error("Fetch pending comments error:", err);
        res.status(500).json({ message: err.message });
    }
});

// UPDATE COMMENT STATUS (Approve/Reject - Req #12)
// PATCH /api/reviews/comment/:commentId
router.patch('/comment/:commentId', async (req, res) => {
    try {
        const { commentId } = req.params;
        const { status, managerId } = req.body; // status: 'approved' or 'rejected'

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: "Invalid status." });
        }

        const comment = await Comment.findByIdAndUpdate(
            commentId,
            { 
                status: status,
                approvedBy: managerId,
                approvedAt: new Date()
            },
            { new: true }
        );

        if (!comment) {
            return res.status(404).json({ message: "Comment not found." });
        }

        res.status(200).json({ message: `Comment ${status} successfully.`, comment });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
