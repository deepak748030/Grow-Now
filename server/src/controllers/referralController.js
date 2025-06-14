import Setting from "../models/Setting.js";
import SubscriptionOrders from "../models/SubscriptionOrders.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";

// controllers/userController.js
export const getReferralStats = async (req, res) => {
  try {
    const id = req.params.id;

    const user = await User.findById(id).populate("referredUsers.user");
    if (!user) return res.status(404).json({ message: "User not found" });

    const totalReferrals = user.referredUsers.length;
    let totalEarnings = 0;

    const referredUsers = user.referredUsers
      .filter((ref) => ref.user)
      .map((ref) => {
        totalEarnings += ref.earnedCredit || 0;
        return ref.user._id;
      });

    // Get all active subscriptions for referred users
    const activeSubscriptions = await SubscriptionOrders.find({
      userID: { $in: referredUsers },
      subscriptionStatus: "Active",
    });

    const subscribedUserIds = new Set(
      activeSubscriptions.map((sub) => sub.userID.toString())
    );

    // Build list of subscribed referred users
    const subscribedUsers = user.referredUsers
      .filter(
        (ref) => ref.user && subscribedUserIds.has(ref.user._id.toString())
      )
      .map((ref) => ({
        _id: ref.user._id,
        name: ref.user.name || "",
        email: ref.user.email || "",
      }));

    const subscribedReferrals = subscribedUsers.length;

    res.json({
      totalReferrals,
      subscribedReferrals,
      totalEarnings,
      subscribedUsers,
    });
  } catch (err) {
    console.error("Error in getReferralStats:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
};

export const applyReferralCode = async (req, res) => {
  try {
    const { referralCode, id } = req.body;

    const referrer = await User.findOne({ referCode: referralCode });
    if (!referrer) {
      return res.status(400).json({ message: "Invalid referral code" });
    }

    const user = await User.findById(id);
    if (!user || user.referredBy) {
      return res
        .status(400)
        .json({ message: "Referral already applied or user not found" });
    }

    // Link the referred user
    user.referredBy = referrer._id;
    await user.save();

    const settings = await Setting.findOne();
    // const referReward = settings?.referReward || 0;
    const maxRefers = settings?.maxRefers || 0;

    // Check how many users this referrer has already referred
    if (referrer.referredUsers.length >= maxRefers) {
      console.log("Referrer has reached max referrals, no reward added");
    } else {
      // Add new referred user and reward
      referrer.referredUsers.push({
        user: user._id,
        // earnedCredit: referReward,
      });

      // referrer.bonusWallet = (referrer.bonusWallet || 0) + referReward;
      await referrer.save();
      // Log the transaction
      //   await Transaction.create({
      //     title: "Referral Bonus",
      //     description: `Referral bonus credited for user ${user._id}`,
      //     amount: referReward,
      //     type: 'credit',
      //     status: 'success',
      //     category: 'referral',
      //   });
    }
    res.json({ message: "Referral applied successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
};

export const getAllReferralStatsForAdmin = async (req, res) => {
  try {
    const users = await User.find({
      "referredUsers.0": { $exists: true },
    }).populate("referredUsers.user");

    const report = [];

    for (const user of users) {
      const referredUsers = user.referredUsers
        .filter((ref) => ref.user) // Ensure valid users
        .map((ref) => ({
          _id: ref.user._id,
          name: ref.user.name || "",
          email: ref.user.email || "",
        }));

      const referredUserIds = referredUsers.map((u) => u._id);
      const totalReferrals = referredUserIds.length;
      const totalEarnings = referredUsers.reduce(
        (acc, ref) => acc + (ref.earnedCredit || 0),
        0
      );

      // Check how many of these referred users have active subscriptions
      const activeSubscriptions = await SubscriptionOrders.find({
        userID: { $in: referredUserIds },
        subscriptionStatus: "Active",
      });

      const subscribedUserIds = new Set(
        activeSubscriptions.map((sub) => sub.userID.toString())
      );

      const enrichedReferredUsers = referredUsers.map((u) => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        hasActiveSubscription: subscribedUserIds.has(u._id.toString()),
      }));

      const subscribedReferrals = enrichedReferredUsers.filter(
        (u) => u.hasActiveSubscription
      ).length;

      report.push({
        referrerId: user._id,
        referrerName: user.name || user.email,
        referCode: user.referCode,
        totalReferrals,
        subscribedReferrals,
        totalEarnings,
        referredUsers: enrichedReferredUsers,
      });
    }

    res.json({ success: true, data: report });
  } catch (err) {
    console.error("Admin referral stats error:", err);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};
