const Bill = require('../models/Bill');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');

// Helper to generate unique human-friendly Bill Number
async function generateBillNumber() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  
  // Count bills created today to format sequence
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const todayCount = await Bill.countDocuments({
    createdAt: { $gte: startOfDay, $lte: endOfDay },
  });

  const seq = String(todayCount + 1).padStart(3, '0');
  const randomSuffix = Math.floor(100 + Math.random() * 900); // 3 digit random to guarantee uniqueness under race conditions
  return `CS-${dateStr}-${seq}${randomSuffix}`;
}

// Create Bill (Atomic stock deduction & validation)
exports.createBill = async (req, res) => {
  const deductedProducts = []; // Track for rollback if atomic deduction fails midway

  try {
    const { customerName, roomNumber, items, paymentStatus } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart items cannot be empty' });
    }

    const validStatus = paymentStatus === 'UNPAID' ? 'UNPAID' : 'PAID';

    // 1. Fetch current product data from DB
    const productIds = items.map((i) => i.productId);
    const dbProducts = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map();
    dbProducts.forEach((p) => productMap.set(p._id.toString(), p));

    // 2. Validate items, stock, and calculate backend totals
    let calculatedTotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const pid = String(item.productId);
      const product = productMap.get(pid);

      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product with ID ${item.productId} was not found in inventory.`,
        });
      }

      const qty = parseInt(item.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid quantity for ${product.name}. Must be at least 1.`,
        });
      }

      if (product.quantity < qty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Available: ${product.quantity}, requested: ${qty}.`,
        });
      }

      const unitPrice = product.price;
      const lineTotal = unitPrice * qty;
      calculatedTotal += lineTotal;

      validatedItems.push({
        productId: product._id,
        productName: product.name,
        colour: product.colour,
        unitPrice,
        quantity: qty,
        lineTotal,
      });
    }

    // 3. Atomically deduct stock for each item using conditional update
    for (const item of validatedItems) {
      const result = await Product.updateOne(
        { _id: item.productId, quantity: { $gte: item.quantity } },
        { $inc: { quantity: -item.quantity } }
      );

      if (result.matchedCount === 0 || result.modifiedCount === 0) {
        // Atomic deduction failed! Another transaction consumed the stock in between.
        // Rollback previously deducted items
        for (const rolled of deductedProducts) {
          await Product.updateOne(
            { _id: rolled.productId },
            { $inc: { quantity: rolled.quantity } }
          );
        }

        return res.status(409).json({
          success: false,
          message: `Stock conflict: "${item.productName}" stock was updated or depleted by another sale. Please refresh.`,
        });
      }

      deductedProducts.push(item);
    }

    // 4. Create Bill
    const billNumber = await generateBillNumber();
    const isPaid = validStatus === 'PAID';

    const bill = new Bill({
      billNumber,
      customerName: customerName ? customerName.trim() : '',
      roomNumber: roomNumber ? roomNumber.trim() : '',
      items: validatedItems,
      totalAmount: calculatedTotal,
      paymentStatus: validStatus,
      paidAt: isPaid ? new Date() : null,
      createdAt: new Date(),
    });

    await bill.save();

    // 5. Record StockMovements for each item
    const movements = validatedItems.map((item) => ({
      productId: item.productId,
      movementType: 'SALE',
      quantityChange: -item.quantity,
      reason: `Sale on Bill #${billNumber}${bill.customerName ? ` (${bill.customerName})` : ''}`,
      billId: bill._id,
      createdAt: new Date(),
    }));

    await StockMovement.insertMany(movements);

    return res.status(201).json({
      success: true,
      message: 'Bill created and stock updated successfully',
      bill,
    });
  } catch (error) {
    console.error('Error creating bill:', error);

    // Rollback any deducted items in case of unhandled error
    if (deductedProducts.length > 0) {
      for (const rolled of deductedProducts) {
        try {
          await Product.updateOne(
            { _id: rolled.productId },
            { $inc: { quantity: rolled.quantity } }
          );
        } catch (rbError) {
          console.error('Rollback error for product:', rolled.productId, rbError);
        }
      }
    }

    return res.status(500).json({ success: false, message: 'Failed to complete sale transaction' });
  }
};

// Get Bills with search & filter
exports.getBills = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (status === 'PAID') {
      filter.paymentStatus = 'PAID';
    } else if (status === 'UNPAID') {
      filter.paymentStatus = 'UNPAID';
    }

    if (search && search.trim()) {
      const term = search.trim();
      filter.$or = [
        { billNumber: { $regex: term, $options: 'i' } },
        { customerName: { $regex: term, $options: 'i' } },
        { roomNumber: { $regex: term, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const pageLimit = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * pageLimit;

    const [bills, total] = await Promise.all([
      Bill.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageLimit),
      Bill.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      bills,
      total,
      page: pageNum,
      pages: Math.ceil(total / pageLimit) || 1,
    });
  } catch (error) {
    console.error('Error fetching bills:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch bills' });
  }
};

// Get single Bill details
exports.getBillById = async (req, res) => {
  try {
    const { id } = req.params;
    const bill = await Bill.findById(id);

    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    return res.json({ success: true, bill });
  } catch (error) {
    console.error('Error getting bill:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch bill' });
  }
};

// Update Payment Status (e.g. UNPAID -> PAID)
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    if (!['PAID', 'UNPAID'].includes(paymentStatus)) {
      return res.status(400).json({ success: false, message: 'Payment status must be PAID or UNPAID' });
    }

    const bill = await Bill.findById(id);
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    bill.paymentStatus = paymentStatus;
    if (paymentStatus === 'PAID') {
      bill.paidAt = new Date();
    } else {
      bill.paidAt = null;
    }

    await bill.save();

    return res.json({
      success: true,
      message: `Bill marked as ${paymentStatus}`,
      bill,
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    return res.status(500).json({ success: false, message: 'Failed to update payment status' });
  }
};
