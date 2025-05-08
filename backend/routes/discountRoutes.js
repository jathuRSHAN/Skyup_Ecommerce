const router = require('express').Router();
const Discount = require('../models/Discount');
const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware');
const Item = require('../models/Item');
const SubCategory = require('../models/SubCategory');
const Category = require('../models/Category');

//get all discounts
router.get('/', authenticateToken, authorizeRole("Admin"), async (req, res) => {
    try {
        const discounts = await Discount.find().populate('applicableItems').populate('applicable_SubCategories').populate('applicableCategories').exec();
        res.status(200).send(discounts);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

//get discount by id
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const discount = await Discount.findById(req.params.id).populate('applicableItems').populate('applicable_SubCategories').populate('applicableCategories').exec();
        if (!discount) {
            return res.status(404).send({ error: 'Discount not found' });
        }
        res.status(200).send(discount);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

//create a new discount
router.post('/', authenticateToken, authorizeRole("Admin"), async (req, res) => {
    try {
        const { code, type, value, minPurchase, maxDiscount, applicableItems, applicable_SubCategories, applicableCategories, startDate, endDate, isActive, usageLimit } = req.body;
        if (!type || !value || !startDate || !endDate) {
            return res.status(400).send({ error: 'Missing required fields' });
        }

        const currentDate = new Date();
        const inputStartDate = new Date(startDate);

        if (inputStartDate <= currentDate) {
            return res.status(400).send({ error: 'Start date must be in the future' });
        }

        // Validate date range
        if (new Date(startDate) >= new Date(endDate)) {
            return res.status(400).send({ error: 'Start date must be before end date' });
        }

        // Validate item IDs
        if (applicableItems && !Array.isArray(applicableItems)) {
            return res.status(400).send({ error: 'Applicable items must be an array of IDs' });
        }
        if (applicable_SubCategories && !Array.isArray(applicable_SubCategories)) {
            return res.status(400).send({ error: 'Applicable subcategories must be an array of IDs' });
        }
        if (applicableCategories && !Array.isArray(applicableCategories)) {
            return res.status(400).send({ error: 'Applicable categories must be an array of IDs' });
        }

        // Check if discount code already exists
        const existingDiscount = await Discount.findOne({ code });
        if (existingDiscount) {
            return res.status(400).send({ error: 'Discount code already exists' });
        }

        // Create new discount
        const discount = new Discount({
            code,
            type,
            value,
            minPurchase,
            maxDiscount,
            applicableItems,
            applicable_SubCategories,
            applicableCategories,
            startDate,
            endDate,
            isActive,
            usageLimit
        });

        await discount.save();
        res.status(201).send(discount);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

//update discount by id
router.put('/:id', authenticateToken, authorizeRole("Admin"), async (req, res) => {
    try {
        const { code, type, value, minPurchase, maxDiscount, applicableItems, applicable_SubCategories, applicableCategories, startDate, endDate, isActive, usageLimit } = req.body;
        if (!type || !value || !startDate || !endDate) {
            return res.status(400).send({ error: 'Missing required fields' });
        }

        const currentDate = new Date();
        const inputStartDate = new Date(startDate);

        if (inputStartDate <= currentDate) {
            return res.status(400).send({ error: 'Start date must be in the future' });
        }

        // Validate date range
        if (new Date(startDate) >= new Date(endDate)) {
            return res.status(400).send({ error: 'Start date must be before end date' });
        }

        // Validate item IDs
        if (applicableItems && !Array.isArray(applicableItems)) {
            return res.status(400).send({ error: 'Applicable items must be an array of IDs' });
        }
        if (applicable_SubCategories && !Array.isArray(applicable_SubCategories)) {
            return res.status(400).send({ error: 'Applicable subcategories must be an array of IDs' });
        }
        if (applicableCategories && !Array.isArray(applicableCategories)) {
            return res.status(400).send({ error: 'Applicable categories must be an array of IDs' });
        }

        // Check if discount code already exists
        const existingDiscount = await Discount.findOne({ code });
        if (existingDiscount && existingDiscount._id.toString() !== req.params.id) {
            return res.status(400).send({ error: 'Discount code already exists' });
        }

        // Update discount
        const discount = await Discount.findByIdAndUpdate(req.params.id, {
            code,
            type,
            value,
            minPurchase,
            maxDiscount,
            applicableItems,
            applicable_SubCategories,
            applicableCategories,
            startDate,
            endDate,
            isActive,
            usageLimit
        }, { new: true }).populate('applicableItems').populate('applicable_SubCategories').populate('applicableCategories').exec();

        if (!discount) {
            return res.status(404).send({ error: 'Discount not found' });
        }

        res.status(200).send(discount);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

//delete discount by id
router.delete('/:id', authenticateToken, authorizeRole("Admin"), async (req, res) => {
    try {
        const discount = await Discount.findByIdAndDelete(req.params.id);
        if (!discount) {
            return res.status(404).send({ error: 'Discount not found' });
        }
        res.status(200).send({ message: 'Discount deleted successfully' });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

module.exports = router;