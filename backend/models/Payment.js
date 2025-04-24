const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PaymentSchema = new Schema({
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['Credit Card', 'Debit Card', 'Net Banking'], required: true },
    transactionId: { type: String },
    status: { type: String, enum: ['Pending', 'Completed', 'Failed','Canceled','Processing'], default: 'Pending' },
}, {
    timestamps: true
});

// Pre-save hook to set timestamps to IST
PaymentSchema.pre('save', function (next) {
    const now = new Date();
    const offset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    this.createdAt = new Date(now.getTime() + offset);
    this.updatedAt = new Date(now.getTime() + offset);
    next();
});

const Payment = mongoose.model('Payment', PaymentSchema);
module.exports = Payment;