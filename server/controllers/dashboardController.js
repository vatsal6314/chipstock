const Product = require('../models/Product');
const Bill = require('../models/Bill');
const Settings = require('../models/Settings');
const localStore = require('../localStore');

exports.getDashboardStats = async (req, res) => {
  try {
    if (global.isLocalMode) {
      const settings = localStore.data.settings || { lowStockThreshold: 5 };
      const lowStockThreshold = settings.lowStockThreshold || 5;

      const activeProducts = localStore.data.products.filter((p) => p.isActive);
      const totalProducts = activeProducts.length;
      const totalPieces = activeProducts.reduce((sum, p) => sum + (p.quantity || 0), 0);

      const lowStockProducts = activeProducts
        .filter((p) => p.quantity <= lowStockThreshold)
        .sort((a, b) => a.quantity - b.quantity);

      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      const todayBills = localStore.data.bills.filter((b) => {
        const d = new Date(b.createdAt);
        return d >= startOfToday && d <= endOfToday;
      });

      const todayPaidRevenue = localStore.data.bills
        .filter((b) => {
          if (b.paymentStatus !== 'PAID') return false;
          const pDate = b.paidAt ? new Date(b.paidAt) : new Date(b.createdAt);
          return pDate >= startOfToday && pDate <= endOfToday;
        })
        .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

      const unpaidBills = localStore.data.bills.filter((b) => b.paymentStatus === 'UNPAID');
      const totalPendingAmount = unpaidBills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

      const recentBills = [...localStore.data.bills]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      return res.json({
        success: true,
        stats: {
          totalProducts,
          totalPieces,
          todayPaidRevenue,
          totalPendingAmount,
          totalPendingBillsCount: unpaidBills.length,
          billsTodayCount: todayBills.length,
          lowStockThreshold,
          lowStockCount: lowStockProducts.length,
          lowStockProducts,
          recentBills,
        },
      });
    }

    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    const lowStockThreshold = settings.lowStockThreshold || 5;

    const totalProducts = await Product.countDocuments({ isActive: true });
    
    const piecesAggregation = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, totalPieces: { $sum: '$quantity' } } },
    ]);
    const totalPieces = piecesAggregation.length > 0 ? piecesAggregation[0].totalPieces : 0;

    const lowStockProducts = await Product.find({
      isActive: true,
      quantity: { $lte: lowStockThreshold },
    }).sort({ quantity: 1 });

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const billsTodayCount = await Bill.countDocuments({
      createdAt: { $gte: startOfToday, $lte: endOfToday },
    });

    const todayPaidRevenueAgg = await Bill.aggregate([
      {
        $match: {
          paymentStatus: 'PAID',
          $or: [
            { paidAt: { $gte: startOfToday, $lte: endOfToday } },
            { paidAt: null, createdAt: { $gte: startOfToday, $lte: endOfToday } },
          ],
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
        },
      },
    ]);
    const todayPaidRevenue = todayPaidRevenueAgg.length > 0 ? todayPaidRevenueAgg[0].totalRevenue : 0;

    const pendingDuesAgg = await Bill.aggregate([
      { $match: { paymentStatus: 'UNPAID' } },
      { $group: { _id: null, totalPending: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
    ]);
    const totalPendingAmount = pendingDuesAgg.length > 0 ? pendingDuesAgg[0].totalPending : 0;
    const totalPendingBillsCount = pendingDuesAgg.length > 0 ? pendingDuesAgg[0].count : 0;

    const recentBills = await Bill.find()
      .sort({ createdAt: -1 })
      .limit(5);

    return res.json({
      success: true,
      stats: {
        totalProducts,
        totalPieces,
        todayPaidRevenue,
        totalPendingAmount,
        totalPendingBillsCount,
        billsTodayCount,
        lowStockThreshold,
        lowStockCount: lowStockProducts.length,
        lowStockProducts,
        recentBills,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
  }
};
