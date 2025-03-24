const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

const User = require('../models/user');
const Admin = require('../models/admin');
const Customer = require('../models/Customer');

const {authenticateToken, authorizeRole} = require('../middlewares/authMiddleware');

//get all users
router.get('/customers', authenticateToken, authorizeRole("Admin"), async (req, res) => {
    try {
        const customerUsers = await Customer.find()
            .populate('userId', 'name email address phone')// Populate the 'userId' field with User data
            .exec();

        res.status(200).send(customerUsers);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

//get customer by id
router.get('/customers/:id', authenticateToken, async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            return res.status(404).send({ error: 'Customer not found' });
        }
        await customer.populate('userId', 'name email address phone');
        
        res.status(200).send(customer);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

//update customer by id
router.put('/customers/:id', authenticateToken, async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            return res.status(404).send({ error: 'Customer not found' });
        }

        const user = await User.findById(customer.userId);
        user.name = req.body.name;
        user.email = req.body.email;
        user.address = req.body.address;
        user.phone = req.body.phone;
        

        customer.loyaltyPoints = req.body.loyaltyPoints;
        customer.preferredPaymentMethod = req.body.preferredPaymentMethod;
        await customer.save();
        await user.save();

        res.status(200).send({ message: 'Customer updated successfully' });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

//delete customer by id
router.delete('/customers/:id', authenticateToken, async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            return res.status(404).send({ error: 'Customer not found' });
        }
        const user = await User.findById(customer.userId);
        await customer.deleteOne();
        await user.deleteOne();

        res.status(200).send({ message: 'Customer deleted successfully' });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

//change password
router.put('/change-password', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const isMatch = await bcrypt.compare(req.body.oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).send({ error: 'Invalid password' });
        }
        user.password = req.body.newPassword;
        await user.save();
        res.status(200).send({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

//get all admins
router.get('/admins', authenticateToken, authorizeRole("Admin"), async (req, res) => {
    try {
        const adminUsers = await Admin.find()
            .populate('userId', 'name email address phone')// Populate the 'userId' field with User data
            .exec();

        res.status(200).send(adminUsers);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

//get admin by id
router.get('/admins/:id', authenticateToken, async (req, res) => {
    try {
        const admin = await Admin.findById(req.params.id);

        if (!admin) {
            return res.status(404).send({ error: 'Admin not found' });
        }
        await admin.populate('userId', 'name email address phone');
        
        res.status(200).send(admin);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

//update admin by id
router.put('/admins/:id', authenticateToken, async (req, res) => {
    try {
        const admin = await Admin.findById(req.params.id);

        if (!admin) {
            return res.status(404).send({ error: 'Admin not found' });
        }

        const user = await User.findById(admin.userId);
        user.name = req.body.name;
        user.email = req.body.email;
        user.address = req.body.address;
        user.phone = req.body.phone;
        
        await user.save();

        res.status(200).send({ message: 'Admin updated successfully' });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});


module.exports = router;