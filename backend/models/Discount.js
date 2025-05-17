const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DiscountSchema = new Schema({
    code: { type: String, unique: true, sparse: true }, // e.g., "SAVE10" for coupons
    type: { type: String, enum: ['percentage', 'fixed', 'bogo'], required: true }, // Discount type
    value: { type: Number, required: true }, // e.g., 10 for 10% or $10
    minPurchase: { type: Number, default: 0 }, // Minimum cart value to qualify
    maxDiscount: { type: Number }, // Optional cap on discount (e.g., max $50 off)
    applicableItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }], // Specific items (optional)
    applicable_SubCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory' }], // e.g., ["electronics", "clothing"]
    applicableCategories: [{type: mongoose.Schema.Types.ObjectId, ref: 'Category'}], // e.g., ["fruits", "vegetables"]
    startDate: { type: Date, required: true }, // When discount starts
    endDate: { type: Date, required: true }, // When discount expires
    isActive: { type: Boolean, default: true }, // Enable/disable discount
    usageLimit: { type: Number }, // Max uses (optional, e.g., 100 customers)
    usedCount: { type: Number, default: 0 }, // Track usage
    userSpecific: { type: Boolean, default: false }, // e.g., for first-time users
    applicableUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Specific users (optional)
}, {
    timestamps: true
});

DiscountSchema.pre('save', function (next) {
    const now = new Date();
    const offset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    this.createdAt = new Date(now.getTime() + offset);
    this.updatedAt = new Date(now.getTime() + offset);
    next();
} );

const Discount = mongoose.model('Discount', DiscountSchema);
module.exports = Discount;