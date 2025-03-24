const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const customerSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    loyaltyPoints: { type: Number, default: 0 },
    preferredPaymentMethod: { type: String, enum:['Credit Card', 'Debit Card', 'Cash'], required: true },
},
{
    timestamps: true
});

const Customer = mongoose.model('Customer', customerSchema);
module.exports = Customer;