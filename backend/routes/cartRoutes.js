const express = require('express');
const router = express.Router();

const Cart = require('../models/Cart');
const Customer = require('../models/Customer');
const Item = require('../models/Item');
const {authenticateToken} = require('../middlewares/authMiddleware');

// Get the cart for a customer
router.get('/', authenticateToken, async (req, res) => {
    try {
        const customer = await Customer.findById(req.user.id);
        if (!customer) {
            return res.status(404).send({ error: 'Customer not found' });
        }
        const cart = await Cart.findOne({ customerId: req.user.id }).populate('items.itemId');
        res.status(200).send(cart);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// Add an item to the cart
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { itemId, quantity } = req.body;
        if (!itemId || !quantity) {
            return res.status(400).send({ error: 'Missing required fields' });
        }

        const customer = await Customer.findById(req.user.id);
        if (!customer) {
            return res.status(404).send({ error: 'Customer not found' });
        }

        const item = await Item.findById(itemId);
        if (!item) {
            return res.status(404).send({ error: 'Item not found' });
        }

        let cart = await Cart.findOne({ customerId: req.user.id });
        if (!cart) {
            cart = new Cart({ customerId: req.user.id, items: [] });
        }

        const itemIndex = cart.items.findIndex((item) => item.itemId == itemId);
        if (itemIndex > -1) {
            cart.items[itemIndex].quantity += quantity;
        } else {
            cart.items.push({ itemId, quantity });
        }

        await cart.save();
        res.status(201).send(cart);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// Update the quantity of an item in the cart
router.put('/:itemId', authenticateToken, async (req, res) => {
    try {
        const { quantity } = req.body;
        if (!quantity) {
            return res.status(400).send({ error: 'Missing required fields' });
        }

        const customer = await Customer.findById(req.user.id);
        if (!customer) {
            return res.status(404).send({ error: 'Customer not found' });
        }

        const item = await Item.findById(req.params.itemId);
        if (!item) {
            return res.status(404).send({ error: 'Item not found' });
        }

        let cart = await Cart.findOne({ customerId: req.user.id });
        if (!cart) {
            return res.status(404).send({ error: 'Cart not found' });
        }

        const itemIndex = cart.items.findIndex((item) => item.itemId == req.params.itemId);
        if (itemIndex > -1) {
            cart.items[itemIndex].quantity = quantity;
        } else {
            return res.status(404).send({ error: 'Item not found in cart' });
        }

        await cart.save();
        res.status(200).send(cart);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// Remove an item from the cart
router.delete('/:itemId', authenticateToken, async (req, res) => {
    try {
        const customer = await Customer.findById(req.user.id);
        if (!customer) {
            return res.status(404).send({ error: 'Customer not found' });
        }

        const item = await Item.findById(req.params.itemId);
        if (!item) {
            return res.status(404).send({ error: 'Item not found' });
        }

        let cart = await Cart.findOne({ customerId: req.user.id });
        if (!cart) {
            return res.status(404).send({ error: 'Cart not found' });
        }

        const itemIndex = cart.items.findIndex((item) => item.itemId == req.params.itemId);
        if (itemIndex > -1) {
          cart.items[itemIndex].quantity -= 1; // Reduce by 1
          // Remove if quantity reaches 0
          if (cart.items[itemIndex].quantity <= 0) {
            cart.items.splice(itemIndex, 1);
          }
        } else {
          return res.status(404).send({ error: 'Item not found in cart' });
        }

        await cart.save();
        res.status(200).send(cart);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

module.exports = router;