const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required']
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
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
      trim: true
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity cannot be less than 1']
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0, 'Unit price cannot be negative']
    },
    lineTotal: {
      type: Number,
      required: [true, 'Line total is required'],
      min: [0, 'Line total cannot be negative']
    }
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: [true, 'Invoice number is required'],
      unique: true,
      trim: true
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order is required'],
      unique: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer is required']
    },
    billingEmail: {
      type: String,
      required: [true, 'Billing email is required'],
      lowercase: true,
      trim: true
    },
    billingAddress: {
      type: String,
      required: [true, 'Billing address is required'],
      trim: true
    },
    items: {
      type: [invoiceItemSchema],
      validate: {
        validator: (items) => items.length > 0,
        message: 'Invoice must include at least one item'
      }
    },
    subtotal: {
      type: Number,
      required: [true, 'Subtotal is required'],
      min: [0, 'Subtotal cannot be negative']
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
      default: function () {
        return this.subtotal;
      }
    },
    pdfUrl: {
      type: String,
      trim: true,
      default: null
    },
    emailStatus: {
      type: String,
      enum: ['pending', 'mock-sent', 'sent', 'failed'],
      default: 'pending'
    },
    issuedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

invoiceSchema.index({ customer: 1, issuedAt: -1 });
invoiceSchema.index({ emailStatus: 1, issuedAt: -1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
