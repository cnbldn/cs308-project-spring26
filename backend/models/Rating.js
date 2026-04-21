const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required']
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer is required']
    },
    value: {
      type: Number,
      required: [true, 'Rating value is required'],
      min: [1, 'Rating cannot be less than 1'],
      max: [5, 'Rating cannot be greater than 5']
    }
  },
  {
    timestamps: true
  }
);

ratingSchema.index({ product: 1, createdAt: -1 });
ratingSchema.index({ customer: 1, product: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);
