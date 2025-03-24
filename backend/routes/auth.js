const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
//const { v4: uuidv4 } = require('uuid');
const User = require('../models/user');
const Admin = require('../models/admin');
const Customer = require('../models/Customer');
const { generateToken } = require('../utils/jwt');

router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, userType, address, phone } = req.body;
        const user = new User({ name, email, password, userType, address, phone });
       
        if(userType === 'Admin'){
            const admin = new Admin({ userId: user._id });
            await admin.save();
        } else if(userType === 'Customer'){
            const customer = new Customer({ userId: user._id, loyaltyPoints: 0, preferredPaymentMethod: req.body.preferredPaymentMethod });
            await customer.save();
        }else{
            res.status(400).send({ error: 'Invalid user type' });
        }
        await user.save();
        const payload = {
            id: user._id,
            email: user.email,
            userType: user.userType
        };  
        const token = generateToken(payload);
        res.status(201).send({ message: 'User created successfully', token });
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({
            email
        });
        if (!user) {
            return res.status(400).send({ error: 'Invalid login credentials' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send({ error: 'Invalid login credentials' });
        }
        const payload = {
            id: user._id,
            email: user.email,
            userType: user.userType
        };
        const token = generateToken(payload);
        res.status(200).json({message: 'Login successful', token});
    } catch (error) {
        res.status(500).send({ message:'Error logging in', error: error.message });
    }
});

module.exports = router;