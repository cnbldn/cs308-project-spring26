const mongoose = require('mongoose');

// Schema for individual items inside the cart
const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity cannot be less than 1.']
  },
  // Storing the price at the time of adding helps render the cart easily,
  // though you should always recalculate during checkout to ensure accuracy.
  price: {
    type: Number,
    required: true
  }
});

// Main Cart Schema
const cartSchema = new mongoose.Schema({
  // For logged-in users
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null 
  },
  // For guest users (Req #4)
  sessionId: {
    type: String,
    default: null
  },
  items: [cartItemSchema],
  cartTotal: {
    type: Number,
    default: 0
  }
}, { 
  timestamps: true // Automatically adds createdAt and updatedAt
});

module.exports = mongoose.model('Cart', cartSchema, 'cart');