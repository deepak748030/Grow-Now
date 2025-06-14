import mongoose from "mongoose";
import SubscriptionOrders from "../models/SubscriptionOrders.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Category from "../models/Category.js";

export const getDashboardStats = async (req, res) => {
  try {
    const { branchId } = req.query;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    // Date ranges
    const currentMonthStart = new Date(year, month, 1);
    const currentMonthEnd = new Date(year, month + 1, 1);
    const prevMonthStart = new Date(year, month - 1, 1);
    const prevMonthEnd = new Date(year, month, 1);

    const branchFilter = branchId ? { assignedFranchiseId: branchId } : {};

    // Helper for percentage change
    const percentChange = (current, prev) => {
      if (prev === 0) return current === 0 ? "0%" : "100%";
      return `${((current - prev) / prev * 100).toFixed(1)}%`;
    };

    // Helper to get week number in month (1-based)
    const getWeekOfMonth = (date) => {
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
      return Math.ceil((date.getDate() + firstDay.getDay()) / 7);
    };

    // Parallel queries
    const [
      usersThisMonth,
      usersLastMonth,
      products,
      productsLastMonth,
      categories,
      totalSalesAgg,
      totalSalesLastMonthAgg,
      orderStatusAgg,
      orderStatusLastMonthAgg,
      monthlySalesAgg,
      // Revenue per week for current month
      revenueCurrentMonthAgg,
      // Revenue per week for previous month
      revenuePrevMonthAgg
    ] = await Promise.all([
      User.find({ createdAt: { $gte: currentMonthStart, $lt: currentMonthEnd } }).lean(),
      User.find({ createdAt: { $gte: prevMonthStart, $lt: prevMonthEnd } }).lean(),
      Product.countDocuments(),
      Product.countDocuments({ createdAt: { $gte: currentMonthStart, $lt: currentMonthEnd } }),
      Category.countDocuments(),
      SubscriptionOrders.aggregate([
        { $match: branchFilter },
        { $group: { _id: null, total: { $sum: "$finalAmount" } } }
      ]),
      SubscriptionOrders.aggregate([
        { $match: { ...branchFilter, createdAt: { $gte: prevMonthStart, $lt: prevMonthEnd } } },
        { $group: { _id: null, total: { $sum: "$finalAmount" } } }
      ]),
      SubscriptionOrders.aggregate([
        { $match: { ...branchFilter, createdAt: { $gte: currentMonthStart, $lt: currentMonthEnd } } },
        { $group: { _id: "$subscriptionStatus", count: { $sum: 1 } } }
      ]),
      SubscriptionOrders.aggregate([
        { $match: { ...branchFilter, createdAt: { $gte: prevMonthStart, $lt: prevMonthEnd } } },
        { $group: { _id: "$subscriptionStatus", count: { $sum: 1 } } }
      ]),
      SubscriptionOrders.aggregate([
        { $match: { ...branchFilter, createdAt: { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) } } },
        { $group: { _id: { $month: "$createdAt" }, sales: { $sum: "$finalAmount" } } }
      ]),
      // Revenue per week for current month
      SubscriptionOrders.aggregate([
        { $match: { ...branchFilter, createdAt: { $gte: currentMonthStart, $lt: currentMonthEnd } } },
        {
          $addFields: {
            week: {
              $ceil: {
                $divide: [
                  { $add: [{ $dayOfMonth: "$createdAt" }, { $subtract: [{ $dayOfWeek: currentMonthStart }, 1] }] },
                  7
                ]
              }
            }
          }
        },
        { $group: { _id: "$week", revenue: { $sum: "$finalAmount" } } }
      ]),
      // Revenue per week for previous month
      SubscriptionOrders.aggregate([
        { $match: { ...branchFilter, createdAt: { $gte: prevMonthStart, $lt: prevMonthEnd } } },
        {
          $addFields: {
            week: {
              $ceil: {
                $divide: [
                  { $add: [{ $dayOfMonth: "$createdAt" }, { $subtract: [{ $dayOfWeek: prevMonthStart }, 1] }] },
                  7
                ]
              }
            }
          }
        },
        { $group: { _id: "$week", revenue: { $sum: "$finalAmount" } } }
      ])
    ]);

    // Order status counts (adjust as per your subscriptionStatus values)
    const statusMap = { Active: 0, Cancelled: 0, Expired: 0 };
    orderStatusAgg.forEach(({ _id, count }) => {
      if (statusMap.hasOwnProperty(_id)) statusMap[_id] = count;
    });
    const lastMonthStatusMap = { Active: 0, Cancelled: 0, Expired: 0 };
    orderStatusLastMonthAgg.forEach(({ _id, count }) => {
      if (lastMonthStatusMap.hasOwnProperty(_id)) lastMonthStatusMap[_id] = count;
    });

    // Monthly sales data
    const salesData = [];
    const monthlySalesMap = {};
    monthlySalesAgg.forEach(({ _id, sales }) => {
      monthlySalesMap[_id] = sales;
    });
    for (let i = 1; i <= 12; i++) {
      salesData.push({
        month: new Date(year, i - 1).toLocaleString("default", { month: "short" }),
        sales: monthlySalesMap[i] || 0
      });
    }

    // Stats calculations
    const totalSalesAmount = totalSalesAgg[0]?.total || 0;
    const lastMonthSalesAmount = totalSalesLastMonthAgg[0]?.total || 0;
    const formattedTotalSales = `₹${totalSalesAmount.toLocaleString("en-IN")}`;
    const ordersCount = statusMap.Active + statusMap.Cancelled + statusMap.Expired;
    const lastMonthOrdersCount = lastMonthStatusMap.Active + lastMonthStatusMap.Cancelled + lastMonthStatusMap.Expired;

    const totalStats = [
      {
        title: "Total Sales",
        value: formattedTotalSales,
        icon: "DollarSign",
        change: percentChange(totalSalesAmount, lastMonthSalesAmount) + " from last month",
      },
      {
        title: "Orders",
        value: `${ordersCount}`,
        icon: "ShoppingCart",
        change: percentChange(ordersCount, lastMonthOrdersCount) + " from last month",
      },
      {
        title: "Products",
        value: `${products}`,
        icon: "Package",
        change: productsLastMonth > 0 ? `+${productsLastMonth} new this month` : "No new products",
      },
      {
        title: "Categories",
        value: `${categories}`,
        icon: "BarChart3",
        change: "No change",
      },
      {
        title: "New Customers",
        value: `${usersThisMonth.length}`,
        icon: "Users",
        change: percentChange(usersThisMonth.length, usersLastMonth.length) + " from last month",
      },
      {
        title: "Active Subscriptions",
        value: `${statusMap.Active}`,
        icon: "CheckCircle",
        change: percentChange(statusMap.Active, lastMonthStatusMap.Active) + " from last month",
      },
    ];

    const orderData = [
      { name: "Active", value: statusMap.Active, color: "#00fe93" },
      { name: "Cancelled", value: statusMap.Cancelled, color: "#fe1e00" },
      { name: "Expired", value: statusMap.Expired, color: "#fe6c00" },
    ];

    // Real revenue data per week for current month, with percentage change from previous month
    const weeksInMonth = (() => {
      const lastDay = new Date(year, month + 1, 0).getDate();
      return Math.ceil((lastDay + new Date(year, month, 1).getDay()) / 7);
    })();

    // Map week number to revenue for current and previous month
    const revenueCurrentMap = {};
    revenueCurrentMonthAgg.forEach(({ _id, revenue }) => {
      revenueCurrentMap[_id] = revenue;
    });
    const revenuePrevMap = {};
    revenuePrevMonthAgg.forEach(({ _id, revenue }) => {
      revenuePrevMap[_id] = revenue;
    });

    const revenueData = [];
    for (let i = 1; i <= weeksInMonth; i++) {
      const currentRevenue = revenueCurrentMap[i] || 0;
      const prevRevenue = revenuePrevMap[i] || 0;
      revenueData.push({
        week: `Week ${i}`,
        revenue: currentRevenue,
        change: percentChange(currentRevenue, prevRevenue) + " from last month"
      });
    }

    return res.status(200).json({
      success: true,
      stats: totalStats,
      salesData,
      orderData,
      revenueData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch dashboard stats" });
  }
};
