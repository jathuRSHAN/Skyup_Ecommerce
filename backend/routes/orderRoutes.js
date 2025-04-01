const express = require('express');
const router = express.Router();

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

// Create a new order
router.post('/', authenticateToken, async (req, res) => {
    try {
        const customer = await Customer.findOne({ userId: req.user.id }).exec(); // Find the customer by userId
        if (!customer) {
            return res.status(404).send({ error: 'Customer not found' });
        } else {
            const orderItems = req.body.order_items;
            let totalAmount = 0;
            for (const item of orderItems) {
                const itemDetails = await Item.findById
                (item.itemId).exec(); // Get the item details
                totalAmount += item.quantity * itemDetails.price; // Calculate the total amount
            }

            const payment = new Payment({
                customerId: customer._id,
                amount: totalAmount,
                paymentMethod: req.body.paymentMethod,
                transactionId: req.body.transactionId,
            });

            await payment.save(); // Save the payment details

            const order = new Order({
                customerId: req.user.id,
                // orderDate: new Date(),
                totalAmount: totalAmount,
                status: 'New',
                order_items: req.body.order_items,
                paymentId: payment._id, // Reference to the payment,
                shippingAddress: req.body.shippingAddress,
                shippingCost: req.body.shippingCost,

            });
            await order.save();
            // customer.loyaltyPoints -= 100; // Deduct 100 loyalty points
            // await customer.save();
            res.status(201).send(order);
        }
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
}
);

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

