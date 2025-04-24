const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the Order schema
const orderSchema = new Schema({

  customerId: {
    type: mongoose.Schema.Types.ObjectId, // Reference to the Customer model
    ref: 'Customer', // Refers to the Customer model
    required: true,
  },
  // orderDate: { type: Date,required: true},
  totalAmount: { type: Number, required: true},
  status: { type: String,
    enum: ["New", "Processing",  "Done", "Cancelled"],
    required: true,
  },
  //shippingCost: { type: Number, required: true, default: 0 },
  order_items: [
    {
      itemId: {type: String, required: true},
      quantity: {type: Number, required: true},
      // priceAtOrder: {type: Number,required: true},
    },
  ],
  paymentId: {type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true},
  /*shippingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
    
  },*/
},
{
  timestamps: true,
});

// Pre-save hook to set timestamps to IST
orderSchema.pre('save', function (next) {
    const now = new Date();
    const offset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    this.createdAt = new Date(now.getTime() + offset);
    this.updatedAt = new Date(now.getTime() + offset);
    next();
});


// Create the Order model
const Order = mongoose.model('Order', orderSchema);

module.exports = Order;