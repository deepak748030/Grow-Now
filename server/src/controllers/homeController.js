import Banner from "../models/DailyTips.js";
import Product from "../models/Product.js";
import Subscription from "../models/Subscription.js";
import Goal from "../models/Goal.js";
import Setting from "../models/Setting.js";
import CategoryByChoices from "../models/CategoryByChoices.js";

// Controller for Home Data
export const getHomeData = async (req, res) => {
    try {
        const rawProducts = await Product.find({}).populate('category');
        const rawSubscriptions = await Subscription.find({});
        const goals = await Goal.find({});
        const banners = await Banner.find({});
        const settings = await Setting.findOne({}) || {};
        const categoriesForChoice = await CategoryByChoices.find({});

        const response = {
            address: "Datia Nagar, Lucknow",
            allSubscriptions: rawSubscriptions.length ? rawSubscriptions : [],
            allProducts: rawProducts.length ? rawProducts : [],
            categoriesForChoice,
            // categoriesForChoice: {
            //     categoryForChoice
            //     // products: rawProducts.length >= 8 ? rawProducts.slice(0, 8) : rawProducts,
            //     // subscriptions: rawSubscriptions.length >= 4 ? rawSubscriptions.slice(0, 4) : rawSubscriptions,
            // },
            banners: {
                data: banners.length ? banners.map(banner => ({
                    type: banner.subscription || "free",
                    images: banner.imageUrl || "https://picsum.photos/200/300",
                })) : Array(8).fill({
                    type: "free",
                    images: "https://picsum.photos/200/300",
                })
            },
            bottomCategory: {
                data: goals.length ? goals.map(goal => ({
                    category: goal.category || "gym",
                    title: goal.title || "Gym",
                    imageUrl: goal.imageUrl || "https://picsum.photos/200/300",
                })) : Array(4).fill({
                    category: "gym",
                    title: "Gym",
                    imageUrl: "https://picsum.photos/200/300",
                })
            },
            bottomImage: settings.bottomImage || "https://picsum.photos/200/300",
            referImage: settings.referImage || "https://picsum.photos/200/300",
            healthyBanner: settings.healthyBanner || "https://picsum.photos/200/300",
            searchBackgroundImage: settings.searchBackgroundImage || "https://picsum.photos/200/300",
            topBannerImage: settings.topBannerImage || "https://picsum.photos/200/300"
        };

        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
