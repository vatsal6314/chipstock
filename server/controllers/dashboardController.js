const Product = require('../models/Product');
const Bill = require('../models/Bill');
const Settings = require('../models/Settings');

exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Get settings for threshold
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    const lowStockThreshold = settings.lowStockThreshold || 5;

    // 2. Products stats
    const totalProducts = await Product.countDocuments({ isActive: true });
    
    // Total available pieces
    const piecesAggregation = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, totalPieces: { $sum: '$quantity' } } },
    ]);
    const totalPieces = piecesAggregation.length > 0 ? piecesAggregation[0].totalPieces : 0;

    // 3. Low stock products
    const lowStockProducts = await Product.find({
      isActive: true,
      quantity: { $lte: lowStockThreshold },
    }).sort({ quantity: 1 });

    // 4. Today's sales metrics
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Bills today
    const billsTodayCount = await Bill.countDocuments({
      createdAt: { $gte: startOfToday, $lte: endOfToday },
    });

    // Today's collected/paid revenue
    // A bill counts towards today's collected revenue if paidAt is today (or createdAt is today and paymentStatus is PAID)
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

    // 5. Total pending / unpaid dues across all time
    const pendingDuesAgg = await Bill.aggregate([
      { $match: { paymentStatus: 'UNPAID' } },
      { $group: { _id: null, totalPending: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
    ]);
    const totalPendingAmount = pendingDuesAgg.length > 0 ? pendingDuesAgg[0].totalPending : 0;
    const totalPendingBillsCount = pendingDuesAgg.length > 0 ? pendingDuesAgg[0].count : 0;

    // Recent 5 bills for fast preview
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
