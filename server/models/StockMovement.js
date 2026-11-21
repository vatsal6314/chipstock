const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    movementType: {
      type: String,
      enum: ['STOCK_IN', 'SALE', 'ADJUSTMENT'],
      required: true,
      index: true,
    },
    quantityChange: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      default: '',
      trim: true,
    },
    billId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bill',
      default: null,
      index: true,
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

module.exports = mongoose.model('StockMovement', stockMovementSchema);
