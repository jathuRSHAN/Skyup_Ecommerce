const express = require('express');
const router = express.Router();
const crypto = require('crypto'); // Add this line at the top with other requires
const Order = require('../models/Order');
const User = require('../models/user');
const Customer = require('../models/Customer');
const Item = require('../models/Item');
const Payment = require('../models/Payment');
const {authenticateToken, authorizeRole} = require('../middlewares/authMiddleware');

// Get all orders
router.get('/', authenticateToken, authorizeRole("Admin"), async (req, res) => {
    try {
        const orders = await Order.find().exec();
        res.status(200).send(orders);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// Get all orders for a customer
router.get('/customer/:customerId', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'Admin' && req.user.id !== req.params.customerId) {
            return res.status(403).send({ error: 'Unauthorized' });
        }
        const orders = await Order.find({ customerId: req.params.customerId }).exec();
        res.status(200).send(orders);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// Get order by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).exec();
        if (!order) {
            return res.status(404).send({ error: 'Order not found' });
        }
        res.status(200).send(order);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// Create a new order and return PayHere redirect URL
router.post('/', authenticateToken, async (req, res) => {
    try {
      // Validate input
      if (!req.body.order_items || !Array.isArray(req.body.order_items)) {
        return res.status(400).send({ error: 'Invalid order items' });
      }
  
      const customer = await Customer.findOne({ userId: req.user.id });
      if (!customer) return res.status(404).send({ error: 'Customer not found' });
  
      // Calculate total
      const items = await Promise.all(
        req.body.order_items.map(async item => {
          const product = await Item.findById(item.itemId);
          return {
            ...item,
            unitPrice: product.price,
            name: product.name
          };
        })
      );
  
      const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  
      // Create payment record
      const payment = new Payment({
        customerId: customer._id,
        amount: totalAmount,
        currency: 'LKR',
        paymentMethod: 'Credit Card',
        status: 'Pending'
      });
      
  
      // Create order
      const order = new Order({
        customerId: req.user.id,
        items,
        totalAmount,
        status: 'New',
        paymentId: payment._id,
        shippingAddress: req.body.shippingAddress
      });
      
  
      // Generate PayHere URL
      const payhereParams = new URLSearchParams({
        merchant_id: "1211144", // Sandbox ID
        return_url: `https://3190-175-157-186-5.ngrok-free.app/payments/success`,
        cancel_url: `https://3190-175-157-186-5.ngrok-free.app/payments/cancel`,
        notify_url: `https://3190-175-157-186-5.ngrok-free.app/payments/notify`,
        order_id: payment._id.toString(),
        items: order.order_items.map(i => i.name).join(', '),
        amount: totalAmount.toFixed(2),
        currency: "LKR",
        first_name: req.body.first_name || customer.name.split(' ')[0],
        last_name: req.body.last_name || customer.name.split(' ')[1] || '',
        email: req.body.email || customer.email,
        phone: req.body.phone || customer.phone,
        address: req.body.shippingAddress,
        city: req.body.city || 'Colombo',
        country: "Sri Lanka",
        delivery_address: req.body.shippingAddress,
        custom_1: `Customer: ${customer._id}`,
        hash: generatePayHereHash(payment._id.toString(), totalAmount.toFixed(2), "LKR")
      });

      //decrese stock
      await Promise.all(
        items.map(async item => {
          const product = await Item.findById(item.itemId);
          if (product.stock < item.quantity) {
            return res.status(400).send({ error: `Not enough stock for ${product.name}` });
          }
          product.stock -= item.quantity;
          await product.save();
        })
      );

      await payment.save();
      await order.save();
  
      const redirectUrl = `https://sandbox.payhere.lk/pay/checkout?${payhereParams.toString()}`;
      console.log("Redirect URL:", redirectUrl);
      res.json({ redirectUrl });
      
    } catch (error) {
      console.error("Order creation error:", error);
      res.status(500).send({ error: "Internal server error" });
    }
  });
  
  // Generate PayHere MD5 hash (required for security)
  function generatePayHereHash(orderId, amount, currency) {
    const secret = "MerchantSecret";
    const concatenated = secret + orderId + amount + currency;
    return crypto.createHash('md5').update(concatenated).digest('hex').toUpperCase();
  }

// cancel order by ID
router.put('/cancel/:id', authenticateToken, authorizeRole("Admin"), async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).exec();
        if (!order) {
            return res.status(404).send({ error: 'Order not found' });
        }
        //const { status } = req.body;
        if(order.status === 'Done'){
            return res.status(400).send({ error: 'Order is already completed' });
        } 
        if(order.status === 'Cancelled'){
            return res.status(400).send({ error: 'Order is already cancelled' });
        }

        order.status = 'Cancelled'; 
        const payment = await Payment.findById(order.paymentId);
        if (payment) {
            payment.status = 'Cancelled'; // Update payment status to Cancelled
            await payment.save();
        }
        await order.save();
        await order.save(); // Save the updated order

        res.status(200).send({ 
            message: 'Order cancelled successfully',
            order 
        });
        
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
}
);

module.exports = router;

