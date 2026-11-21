const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    businessName: {
      type: String,
      default: 'ChipStock',
      trim: true,
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Settings', settingsSchema);
