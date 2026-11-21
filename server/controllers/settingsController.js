const mongoose = require('mongoose');
const Settings = require('../models/Settings');
const Product = require('../models/Product');
const Bill = require('../models/Bill');
const localStore = require('../localStore');

exports.getSettings = async (req, res) => {
  try {
    if (global.isLocalMode) {
      return res.json({
        success: true,
        settings: localStore.data.settings,
        database: {
          status: 'Local JSON Store (Offline / Demo Ready)',
          connected: true,
          host: 'Localhost (data/local-db.json)',
          name: 'chipstock-local',
        },
      });
    }

    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    const dbState = mongoose.connection.readyState;
    const dbStatusMap = {
      0: 'Disconnected',
      1: 'Connected',
      2: 'Connecting',
      3: 'Disconnecting',
    };

    return res.json({
      success: true,
      settings,
      database: {
        status: dbStatusMap[dbState] || 'Unknown',
        connected: dbState === 1,
        host: mongoose.connection.host || 'MongoDB Atlas',
        name: mongoose.connection.name || 'chipstock',
      },
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch settings' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { businessName, lowStockThreshold, currency, timezone } = req.body;

    if (global.isLocalMode) {
      const s = localStore.data.settings;
      if (businessName !== undefined) s.businessName = businessName.trim();
      if (lowStockThreshold !== undefined) {
        const thresh = parseInt(lowStockThreshold, 10);
        if (!isNaN(thresh) && thresh >= 0) s.lowStockThreshold = thresh;
      }
      if (currency !== undefined) s.currency = currency.trim();
      if (timezone !== undefined) s.timezone = timezone.trim();
      localStore.save();
      return res.json({ success: true, settings: s });
    }

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    if (businessName !== undefined) settings.businessName = businessName.trim();
    if (lowStockThreshold !== undefined) {
      const thresh = parseInt(lowStockThreshold, 10);
      if (!isNaN(thresh) && thresh >= 0) {
        settings.lowStockThreshold = thresh;
      }
    }
    if (currency !== undefined) settings.currency = currency.trim();
    if (timezone !== undefined) settings.timezone = timezone.trim();

    await settings.save();
    return res.json({ success: true, settings });
  } catch (error) {
    console.error('Error updating settings:', error);
    return res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
};

exports.exportInventoryCsv = async (req, res) => {
  try {
    let products = [];
    if (global.isLocalMode) {
      products = [...localStore.data.products].sort((a, b) => a.name.localeCompare(b.name));
    } else {
      products = await Product.find().sort({ name: 1 });
    }

    const headers = ['ID', 'Name', 'Price (INR)', 'Quantity', 'Status', 'Color', 'Created At', 'Updated At'];
    const rows = products.map((p) => [
      `"${p._id}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      p.price,
      p.quantity,
      p.isActive ? 'Active' : 'Inactive',
      `"${p.colour}"`,
      `"${p.createdAt ? new Date(p.createdAt).toISOString() : ''}"`,
      `"${p.updatedAt ? new Date(p.updatedAt).toISOString() : ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="chipstock_inventory.csv"');
    return res.send(csvContent);
  } catch (error) {
    console.error('Error exporting inventory CSV:', error);
    return res.status(500).json({ success: false, message: 'Failed to export inventory CSV' });
  }
};

exports.exportBillsCsv = async (req, res) => {
  try {
    let bills = [];
    if (global.isLocalMode) {
      bills = [...localStore.data.bills].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      bills = await Bill.find().sort({ createdAt: -1 });
    }

    const headers = [
      'Bill Number',
      'Date (UTC)',
      'Customer Name',
      'Room Number',
      'Items Summary',
      'Total Amount (INR)',
      'Payment Status',
      'Paid At',
    ];

    const rows = bills.map((b) => {
      const itemsSummary = (b.items || [])
        .map((item) => `${item.productName} (x${item.quantity} @ ₹${item.unitPrice})`)
        .join('; ');

      return [
        `"${b.billNumber}"`,
        `"${b.createdAt ? new Date(b.createdAt).toISOString() : ''}"`,
        `"${(b.customerName || '').replace(/"/g, '""')}"`,
        `"${(b.roomNumber || '').replace(/"/g, '""')}"`,
        `"${itemsSummary.replace(/"/g, '""')}"`,
        b.totalAmount,
        b.paymentStatus,
        `"${b.paidAt ? new Date(b.paidAt).toISOString() : ''}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="chipstock_bills.csv"');
    return res.send(csvContent);
  } catch (error) {
    console.error('Error exporting bills CSV:', error);
    return res.status(500).json({ success: false, message: 'Failed to export bills CSV' });
  }
};
