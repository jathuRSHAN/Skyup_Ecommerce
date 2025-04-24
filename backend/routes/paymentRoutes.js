const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Webhook Secret from PayHere Dashboard
const PAYHERE_WEBHOOK_SECRET = 'MerchantSecret';

// Verify PayHere webhook signature
const verifyWebhook = (req) => {
  const receivedSignature = req.headers['x-payhere-signature'];
  const payload = JSON.stringify(req.body);
  const hmac = crypto.createHmac('sha256', PAYHERE_WEBHOOK_SECRET);
  const computedSignature = hmac.update(payload).digest('hex');
  return receivedSignature === computedSignature;
};

// PayHere Webhook Handler
router.post("/notify", async (req, res) => {
  if (!verifyWebhook(req)) {
    console.warn("Invalid webhook signature");
    return res.status(401).send("Unauthorized");
  }

  const { order_id, payment_status, payhere_amount } = req.body;

  try {
    const order = await Order.findById(order_id);
    const payment = await Payment.findById(order.paymentId);
    if (!payment) {
      console.error(`Payment not found: ${order_id}`);
      return res.status(404).send("Payment not found");
    }

    // Update payment status
    if (payment_status === "2") { // 2 = Success
      payment.status = "Completed";
      payment.amount = payhere_amount; // Store actual paid amount
    } else {
      payment.status = "Failed";
    }

    await payment.save();

    // Update order status
    await Order.updateOne(
      { paymentId: order_id },
      { status: payment_status === "2" ? "Processing" : "Failed" }
    );

    console.log(`Payment ${order_id} updated to: ${payment.status}`);
    res.sendStatus(200);
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.sendStatus(500);
  }
});

// Success/Cancel Pages
router.get("/success", (req, res) => {
  res.send(`
    <h1>Payment Successful ✅</h1>
    <p>Order ID: ${req.query.order_id}</p>
    <p>Thank you for your purchase!</p>
    <a href="/">Return to Shop</a>
  `);
});

router.get("/cancel", (req, res) => {
  res.send(`
    <h1>Payment Cancelled ❌</h1>
    <p>Order ID: ${req.query.order_id}</p>
    <p>You can try again or contact support.</p>
    <a href="/">Try Again</a>
  `);
});

module.exports = router;