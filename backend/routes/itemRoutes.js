const express = require('express');
const router = express.Router();

const Item = require('../models/Item');
const Brand = require('../models/Brand');
const SubCategory = require('../models/SubCategory');
const {authenticateToken, authorizeRole} = require('../middlewares/authMiddleware');

// Get all items
router.get('/', authenticateToken, async (req, res) => {
    try {
        const items = await Item.find();
        res.status(200).send(items);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// Get item by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) {
            return res.status(404).send({ error: 'Item not found' });
        }
        res.status(200).send(item);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// Create a new item
router.post('/', authenticateToken, authorizeRole("Admin"), async (req, res) => {
    try {
        const { name, description, price, subCategoryName, stock, brandName, image } = req.body;
        if (!name || !description || !price || !subCategoryName || !stock || !brandName || !image) {
            return res.status(400).send({ error: 'Missing required fields' });
        }

        const brand = await Brand.findOne({ name: brandName });
        if (!brand) {
            return res.status(404).send({ error: 'Brand not found' });
        }

        const subCategory = await SubCategory.findOne({ name: subCategoryName });
        if (!subCategory) {
            return res.status(404).send({ error: 'SubCategory not found' });
        }

        const item = new Item({
            name,
            description,
            price,
            subCategoryId: subCategory._id,
            stock,
            brandId: brand._id,
            image,
        });
        
        await item.save();
        res.status(201).send({ message: 'Item added successfully' },item);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

// Update item by ID
router.put('/:id', authenticateToken, authorizeRole("Admin"), async (req, res) => {
    try {
        const { name, description, price, subCategoryName, stock, brandName, image } = req.body;
        if (!name || !description || !price || !subCategoryName || !stock || !brandName || !image) {
            return res.status(400).send({ error: 'Missing required fields' });
        }

        const brand = await Brand.findOne({ name: brandName });
        if (!brand) {
            return res.status(404).send({ error: 'Brand not found' });
        }

        const subCategory = await SubCategory.findOne({ name: subCategoryName });
        if (!subCategory) {
            return res.status(404).send({ error: 'SubCategory not found' });
        }

        const item = await Item.findByIdAndUpdate(req.params.id, {
            name,
            description,
            price,
            subCategoryId: subCategory._id,
            stock,
            brandId: brand._id,
            image,
        }, { new: true });

        if (!item) {
            return res.status(404).send({ error: 'Item not found' });
        }

        res.status(200).send(item, { message: 'Item updated successfully' });
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

// Delete item by ID
router.delete('/:id', authenticateToken, authorizeRole("Admin"), async (req, res) => {
    try {
        const item = await Item.findByIdAndDelete(req.params.id);
        if (!item) {
            return res.status(404).send({ error: 'Item not found' });
        }
        res.status(200).send({ message: 'Item deleted successfully' });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

module.exports = router;
