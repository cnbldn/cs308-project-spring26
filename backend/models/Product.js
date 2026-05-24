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
    model: {
      type: String,
      required: [true, 'Product model is required'],
      trim: true
    },
    serialNumber: {
      type: String,
      required: [true, 'Product serial number is required'],
      unique: true,
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative']
    },
    costPrice: {
      type: Number,
      min: [0, 'Cost price cannot be negative'],
      default: function () {
        return (this.price * 0.6).toFixed(2);
      }
    },
    basePrice: {
      type: Number,
      min: [0, 'Base price cannot be negative'],
      default: function () {
        return this.price;
      }
    },
    discountRate: {
      type: Number,
      min: [0, 'Discount rate cannot be negative'],
      max: [100, 'Discount rate cannot exceed 100'],
      default: 0
    },
    discountedPrice: {
      type: Number,
      min: [0, 'Discounted price cannot be negative'],
      default: function () {
        return this.price;
      }
    },
    discountStart: {
      type: Date,
      default: null
    },
    discountEnd: {
      type: Date,
      default: null
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
    warrantyStatus: {
      type: String,
      enum: ['active', 'expired', 'none'],
      default: 'active'
    },
    distributorInfo: {
      name: {
        type: String,
        required: [true, 'Distributor name is required'],
        trim: true
      },
      contactEmail: {
        type: String,
        trim: true,
        lowercase: true
      },
      country: {
        type: String,
        trim: true
      }
    },
    popularity: {
      type: Number,
      min: [0, 'Popularity cannot be negative'],
      default: 0
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

productSchema.pre('validate', function () {
  if (this.basePrice == null) {
    this.basePrice = this.price;
  }

  const safeBasePrice = this.basePrice ?? this.price ?? 0;
  const safeDiscountRate = this.discountRate ?? 0;
  const computedDiscountedPrice = Number(
    (safeBasePrice * (1 - safeDiscountRate / 100)).toFixed(2)
  );

  this.discountedPrice = computedDiscountedPrice;
  this.price = computedDiscountedPrice;

  if (safeDiscountRate === 0) {
    this.discountStart = null;
    this.discountEnd = null;
  }
});

productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ discountRate: 1 });
productSchema.index({ popularity: -1 });
productSchema.index({ stock: 1 });

module.exports = mongoose.model('Product', productSchema);
