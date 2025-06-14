import mongoose from 'mongoose';

const BoxReviewSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'SubscriptionOrder',
    },
    deliveryPartnerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'DeliveryPartner',
    },
    deliveryDate: {
        type: Date,
        required: true,
    },
    deliveryTime: {
        type: String,
        required: true,
    },
    isBoxPicked: {
        type: Boolean,
        default: false,
    },
    isBoxCleaned: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        default: '',
    },
}, {
    timestamps: true,
});

const BoxReview = mongoose.model('BoxReview', BoxReviewSchema);

export default BoxReview;