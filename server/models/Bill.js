const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    colour: {
      type: String,
      default: '#F59E0B',
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const billSchema = new mongoose.Schema(
  {
    billNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    customerName: {
      type: String,
      trim: true,
      default: '',
    },
    roomNumber: {
      type: String,
      trim: true,
      default: '',
    },
    items: {
      type: [billItemSchema],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'A bill must have at least one item',
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['PAID', 'UNPAID'],
      default: 'PAID',
      index: true,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

billSchema.index({ customerName: 'text', roomNumber: 'text', billNumber: 'text' });

module.exports = mongoose.model('Bill', billSchema);
