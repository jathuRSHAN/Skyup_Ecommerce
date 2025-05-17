const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cartSchema = new Schema({
    customerId: { type: Schema.Types.ObjectId, ref:'Customer' , required: true },
    items: [{
        itemId: { type: Schema.Types.ObjectId, ref:'Item' , required: true },
        quantity: { type: Number, required: true },
    }],
},
{
    timestamps: true
});

// Pre-save hook to set timestamps to IST
cartSchema.pre('save', function (next) {
    const now = new Date();
    const offset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    this.createdAt = new Date(now.getTime() + offset);
    this.updatedAt = new Date(now.getTime() + offset);
    next();
});

const cart = mongoose.model('Cart', cartSchema);
module.exports = cart;
