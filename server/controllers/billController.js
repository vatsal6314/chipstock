const Bill = require('../models/Bill');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const localStore = require('../localStore');

// Helper to generate unique human-friendly Bill Number
async function generateBillNumber() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  
  let todayCount = 0;
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  if (global.isLocalMode) {
    todayCount = localStore.data.bills.filter((b) => {
      const bDate = new Date(b.createdAt);
      return bDate >= startOfDay && bDate <= endOfDay;
    }).length;
  } else {
    todayCount = await Bill.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });
  }

  const seq = String(todayCount + 1).padStart(3, '0');
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  return `CS-${dateStr}-${seq}${randomSuffix}`;
}

// Create Bill
exports.createBill = async (req, res) => {
  const deductedProducts = [];

  try {
    const { customerName, roomNumber, items, paymentStatus } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart items cannot be empty' });
    }

    const validStatus = paymentStatus === 'UNPAID' ? 'UNPAID' : 'PAID';

    if (global.isLocalMode) {
      // Local Store Checkout
      let calculatedTotal = 0;
      const validatedItems = [];

      for (const item of items) {
        const product = localStore.data.products.find((p) => p._id === String(item.productId));
        if (!product) {
          return res.status(400).json({
            success: false,
            message: `Product was not found in inventory.`,
          });
        }

        const qty = parseInt(item.quantity, 10);
        if (isNaN(qty) || qty <= 0) {
          return res.status(400).json({
            success: false,
            message: `Invalid quantity for ${product.name}.`,
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

      // Deduct stock
      for (const item of validatedItems) {
        const prod = localStore.data.products.find((p) => p._id === item.productId);
        prod.quantity -= item.quantity;
        prod.updatedAt = new Date().toISOString();
      }

      const billNumber = await generateBillNumber();
      const isPaid = validStatus === 'PAID';

      const bill = {
        _id: localStore.generateId('bill'),
        billNumber,
        customerName: customerName ? customerName.trim() : '',
        roomNumber: roomNumber ? roomNumber.trim() : '',
        items: validatedItems,
        totalAmount: calculatedTotal,
        paymentStatus: validStatus,
        paidAt: isPaid ? new Date().toISOString() : null,
        createdAt: new Date().toISOString(),
      };

      localStore.data.bills.unshift(bill);

      // Record stock movements
      for (const item of validatedItems) {
        localStore.data.stockMovements.push({
          _id: localStore.generateId('mov'),
          productId: item.productId,
          movementType: 'SALE',
          quantityChange: -item.quantity,
          reason: `Sale on Bill #${billNumber}${bill.customerName ? ` (${bill.customerName})` : ''}`,
          billId: bill._id,
          createdAt: new Date().toISOString(),
        });
      }

      localStore.save();

      return res.status(201).json({
        success: true,
        message: 'Bill created and stock updated successfully',
        bill,
      });
    }

    // Atlas MongoDB Mode
    const productIds = items.map((i) => i.productId);
    const dbProducts = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map();
    dbProducts.forEach((p) => productMap.set(p._id.toString(), p));

    let calculatedTotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const pid = String(item.productId);
      const product = productMap.get(pid);

      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product was not found in inventory.`,
        });
      }

      const qty = parseInt(item.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid quantity for ${product.name}.`,
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

    // Atomic stock deduction
    for (const item of validatedItems) {
      const result = await Product.updateOne(
        { _id: item.productId, quantity: { $gte: item.quantity } },
        { $inc: { quantity: -item.quantity } }
      );

      if (result.matchedCount === 0 || result.modifiedCount === 0) {
        for (const rolled of deductedProducts) {
          await Product.updateOne(
            { _id: rolled.productId },
            { $inc: { quantity: rolled.quantity } }
          );
        }

        return res.status(409).json({
          success: false,
          message: `Stock conflict: "${item.productName}" stock was updated by another sale. Please refresh.`,
        });
      }

      deductedProducts.push(item);
    }

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

    if (deductedProducts.length > 0) {
      for (const rolled of deductedProducts) {
        try {
          await Product.updateOne(
            { _id: rolled.productId },
            { $inc: { quantity: rolled.quantity } }
          );
        } catch (rbError) {
          console.error('Rollback error:', rbError);
        }
      }
    }

    return res.status(500).json({ success: false, message: 'Failed to complete sale transaction' });
  }
};

// Get Bills
exports.getBills = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;

    if (global.isLocalMode) {
      let bills = [...localStore.data.bills];

      if (status === 'PAID') bills = bills.filter((b) => b.paymentStatus === 'PAID');
      else if (status === 'UNPAID') bills = bills.filter((b) => b.paymentStatus === 'UNPAID');

      if (search && search.trim()) {
        const term = search.trim().toLowerCase();
        bills = bills.filter((b) => {
          return (
            (b.billNumber && b.billNumber.toLowerCase().includes(term)) ||
            (b.customerName && b.customerName.toLowerCase().includes(term)) ||
            (b.roomNumber && b.roomNumber.toLowerCase().includes(term))
          );
        });
      }

      bills.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const pageNum = parseInt(page, 10) || 1;
      const pageLimit = parseInt(limit, 10) || 50;
      const total = bills.length;
      const paginated = bills.slice((pageNum - 1) * pageLimit, pageNum * pageLimit);

      return res.json({
        success: true,
        bills: paginated,
        total,
        page: pageNum,
        pages: Math.ceil(total / pageLimit) || 1,
      });
    }

    const filter = {};
    if (status === 'PAID') filter.paymentStatus = 'PAID';
    else if (status === 'UNPAID') filter.paymentStatus = 'UNPAID';

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

    if (global.isLocalMode) {
      const bill = localStore.data.bills.find((b) => b._id === id);
      if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
      return res.json({ success: true, bill });
    }

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

// Update Payment Status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    if (!['PAID', 'UNPAID'].includes(paymentStatus)) {
      return res.status(400).json({ success: false, message: 'Payment status must be PAID or UNPAID' });
    }

    if (global.isLocalMode) {
      const bill = localStore.data.bills.find((b) => b._id === id);
      if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });

      bill.paymentStatus = paymentStatus;
      bill.paidAt = paymentStatus === 'PAID' ? new Date().toISOString() : null;
      localStore.save();

      return res.json({
        success: true,
        message: `Bill marked as ${paymentStatus}`,
        bill,
      });
    }

    const bill = await Bill.findById(id);
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    bill.paymentStatus = paymentStatus;
    bill.paidAt = paymentStatus === 'PAID' ? new Date() : null;
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

// Delete single Bill
exports.deleteBill = async (req, res) => {
  try {
    const { id } = req.params;
    const { restoreStock } = req.query;

    if (global.isLocalMode) {
      const billIndex = localStore.data.bills.findIndex((b) => b._id === id);
      if (billIndex === -1) {
        return res.status(404).json({ success: false, message: 'Bill not found' });
      }

      const bill = localStore.data.bills[billIndex];

      // Restore stock if requested
      if (restoreStock === 'true' && bill.items) {
        for (const item of bill.items) {
          const prod = localStore.data.products.find((p) => p._id === item.productId);
          if (prod) {
            prod.quantity += item.quantity;
            localStore.data.stockMovements.push({
              _id: localStore.generateId('mov'),
              productId: prod._id,
              movementType: 'ADJUSTMENT',
              quantityChange: item.quantity,
              reason: `Returned stock from deleted Bill #${bill.billNumber}`,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }

      // Remove stock movements associated with this bill
      localStore.data.stockMovements = localStore.data.stockMovements.filter(
        (m) => String(m.billId) !== id
      );

      // Remove the bill
      localStore.data.bills.splice(billIndex, 1);
      localStore.save();

      return res.json({
        success: true,
        message: `Bill #${bill.billNumber} has been deleted successfully.`,
      });
    }

    // Atlas MongoDB Mode
    const bill = await Bill.findById(id);
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    // Restore stock if requested
    if (restoreStock === 'true' && bill.items) {
      for (const item of bill.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { quantity: item.quantity },
        });

        await StockMovement.create({
          productId: item.productId,
          movementType: 'ADJUSTMENT',
          quantityChange: item.quantity,
          reason: `Returned stock from deleted Bill #${bill.billNumber}`,
          createdAt: new Date(),
        });
      }
    }

    // Delete associated stock movements
    await StockMovement.deleteMany({ billId: bill._id });

    // Delete bill
    await Bill.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: `Bill #${bill.billNumber} has been deleted successfully.`,
    });
  } catch (error) {
    console.error('Error deleting bill:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete bill' });
  }
};
