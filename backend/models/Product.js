const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative']
    },
    stock: {
      type: Number,
      required: true,
      min: [0, 'Stock cannot be negative'],
      default: 0
    },
    category: {
      type: String,
      required: [true, 'Product category is required']
    },
    imageUrl: {
      type: String,
      default: null
    }
  },
  { 
    timestamps: true 
  }
);

module.exports = mongoose.model('Product', productSchema);
