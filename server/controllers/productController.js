const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const Bill = require('../models/Bill');
const localStore = require('../localStore');

// Get all products
exports.getProducts = async (req, res) => {
  try {
    const { status, search } = req.query;

    if (global.isLocalMode) {
      let products = [...localStore.data.products];
      if (status === 'active') {
        products = products.filter((p) => p.isActive);
      } else if (status === 'inactive') {
        products = products.filter((p) => !p.isActive);
      }
      if (search && search.trim()) {
        const s = search.trim().toLowerCase();
        products = products.filter((p) => p.name.toLowerCase().includes(s));
      }
      products.sort((a, b) => a.name.localeCompare(b.name));
      return res.json({ success: true, count: products.length, products });
    }

    const filter = {};
    if (status === 'active') filter.isActive = true;
    else if (status === 'inactive') filter.isActive = false;
    if (search && search.trim()) {
      filter.name = { $regex: search.trim(), $options: 'i' };
    }

    const products = await Product.find(filter).sort({ name: 1 });
    return res.json({ success: true, count: products.length, products });
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
};

// Create product
exports.createProduct = async (req, res) => {
  try {
    const { name, colour, price, initialStock } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Product name is required' });
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({ success: false, message: 'Price must be a non-negative number' });
    }

    const stock = initialStock !== undefined && initialStock !== '' ? parseInt(initialStock, 10) : 0;
    if (isNaN(stock) || stock < 0) {
      return res.status(400).json({ success: false, message: 'Initial stock must be a non-negative integer' });
    }

    if (global.isLocalMode) {
      const product = {
        _id: localStore.generateId('prod'),
        name: name.trim(),
        colour: colour || '#F59E0B',
        price: numPrice,
        quantity: stock,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      localStore.data.products.push(product);

      if (stock > 0) {
        localStore.data.stockMovements.push({
          _id: localStore.generateId('mov'),
          productId: product._id,
          movementType: 'STOCK_IN',
          quantityChange: stock,
          reason: 'Initial stock on product creation',
          createdAt: new Date().toISOString(),
        });
      }

      localStore.save();
      return res.status(201).json({ success: true, product });
    }

    const product = new Product({
      name: name.trim(),
      colour: colour || '#F59E0B',
      price: numPrice,
      quantity: stock,
      isActive: true,
    });

    await product.save();

    if (stock > 0) {
      await StockMovement.create({
        productId: product._id,
        movementType: 'STOCK_IN',
        quantityChange: stock,
        reason: 'Initial stock on product creation',
      });
    }

    return res.status(201).json({ success: true, product });
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({ success: false, message: 'Failed to create product' });
  }
};

// Update product details
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, colour, price, isActive } = req.body;

    if (global.isLocalMode) {
      const product = localStore.data.products.find((p) => p._id === id);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      if (name !== undefined) product.name = name.trim();
      if (colour !== undefined) product.colour = colour;
      if (price !== undefined) {
        const numPrice = Number(price);
        if (isNaN(numPrice) || numPrice < 0) {
          return res.status(400).json({ success: false, message: 'Price must be non-negative' });
        }
        product.price = numPrice;
      }
      if (isActive !== undefined) product.isActive = Boolean(isActive);
      product.updatedAt = new Date().toISOString();

      localStore.save();
      return res.json({ success: true, product });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (name !== undefined) product.name = name.trim();
    if (colour !== undefined) product.colour = colour;
    if (price !== undefined) {
      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice < 0) {
        return res.status(400).json({ success: false, message: 'Price must be a non-negative number' });
      }
      product.price = numPrice;
    }
    if (isActive !== undefined) {
      product.isActive = Boolean(isActive);
    }

    await product.save();
    return res.json({ success: true, product });
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({ success: false, message: 'Failed to update product' });
  }
};

// Add stock (+X pieces)
exports.addStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantityToAdd, reason } = req.body;

    const qty = parseInt(quantityToAdd, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity to add must be a positive integer' });
    }

    if (global.isLocalMode) {
      const product = localStore.data.products.find((p) => p._id === id);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      product.quantity += qty;
      product.updatedAt = new Date().toISOString();

      localStore.data.stockMovements.push({
        _id: localStore.generateId('mov'),
        productId: product._id,
        movementType: 'STOCK_IN',
        quantityChange: qty,
        reason: reason ? reason.trim() : 'Stock added',
        createdAt: new Date().toISOString(),
      });

      localStore.save();
      return res.json({
        success: true,
        message: `Successfully added ${qty} pieces to ${product.name}`,
        product,
      });
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { $inc: { quantity: qty } },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await StockMovement.create({
      productId: product._id,
      movementType: 'STOCK_IN',
      quantityChange: qty,
      reason: reason ? reason.trim() : 'Stock added',
    });

    return res.json({
      success: true,
      message: `Successfully added ${qty} pieces to ${product.name}`,
      product,
    });
  } catch (error) {
    console.error('Error adding stock:', error);
    return res.status(500).json({ success: false, message: 'Failed to add stock' });
  }
};

// Manual Stock Correction
exports.adjustStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { newQuantity, reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'A reason is required for stock correction' });
    }

    const targetQty = parseInt(newQuantity, 10);
    if (isNaN(targetQty) || targetQty < 0) {
      return res.status(400).json({ success: false, message: 'New quantity must be a non-negative integer' });
    }

    if (global.isLocalMode) {
      const product = localStore.data.products.find((p) => p._id === id);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      const previousQty = product.quantity;
      const diff = targetQty - previousQty;
      product.quantity = targetQty;
      product.updatedAt = new Date().toISOString();

      localStore.data.stockMovements.push({
        _id: localStore.generateId('mov'),
        productId: product._id,
        movementType: 'ADJUSTMENT',
        quantityChange: diff,
        reason: `Correction: ${reason.trim()} (Was: ${previousQty}, Now: ${targetQty})`,
        createdAt: new Date().toISOString(),
      });

      localStore.save();
      return res.json({
        success: true,
        message: `Stock corrected from ${previousQty} to ${targetQty}`,
        product,
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const previousQty = product.quantity;
    const diff = targetQty - previousQty;

    product.quantity = targetQty;
    await product.save();

    await StockMovement.create({
      productId: product._id,
      movementType: 'ADJUSTMENT',
      quantityChange: diff,
      reason: `Correction: ${reason.trim()} (Was: ${previousQty}, Now: ${targetQty})`,
    });

    return res.json({
      success: true,
      message: `Stock corrected from ${previousQty} to ${targetQty}`,
      product,
    });
  } catch (error) {
    console.error('Error adjusting stock:', error);
    return res.status(500).json({ success: false, message: 'Failed to adjust stock' });
  }
};

// Stock movements for a product
exports.getProductMovements = async (req, res) => {
  try {
    const { id } = req.params;

    if (global.isLocalMode) {
      const movements = localStore.data.stockMovements
        .filter((m) => m.productId === id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 50);
      return res.json({ success: true, movements });
    }

    const movements = await StockMovement.find({ productId: id })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json({ success: true, movements });
  } catch (error) {
    console.error('Error getting movements:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch stock movements' });
  }
};

// Delete or deactivate product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (global.isLocalMode) {
      const salesCount = localStore.data.bills.filter((b) =>
        b.items.some((i) => i.productId === id)
      ).length;

      const product = localStore.data.products.find((p) => p._id === id);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      if (salesCount > 0) {
        product.isActive = false;
        localStore.save();
        return res.json({
          success: true,
          deactivated: true,
          message: `Product has ${salesCount} recorded sales. It has been deactivated instead of deleted to protect historical data.`,
          product,
        });
      }

      localStore.data.products = localStore.data.products.filter((p) => p._id !== id);
      localStore.save();
      return res.json({
        success: true,
        deleted: true,
        message: 'Product permanently removed',
      });
    }

    const salesCount = await Bill.countDocuments({ 'items.productId': id });

    if (salesCount > 0) {
      const product = await Product.findByIdAndUpdate(id, { isActive: false }, { new: true });
      return res.json({
        success: true,
        deactivated: true,
        message: `Product has ${salesCount} recorded sales. It has been deactivated instead of deleted to protect historical data.`,
        product,
      });
    }

    await Product.findByIdAndDelete(id);
    await StockMovement.deleteMany({ productId: id });

    return res.json({
      success: true,
      deleted: true,
      message: 'Product permanently removed (no historical sales existed)',
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete product' });
  }
};
