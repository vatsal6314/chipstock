const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    colour: {
      type: String,
      required: [true, 'Product color is required'],
      default: '#F59E0B', // Default warm snack color
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    quantity: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock quantity cannot be negative'],
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer quantity',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ name: 'text' });

module.exports = mongoose.model('Product', productSchema);
