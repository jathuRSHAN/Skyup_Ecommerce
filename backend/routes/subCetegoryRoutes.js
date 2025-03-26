const express = require('express');
const router = express.Router();
const SubCategory = require('../models/SubCategory');
const {authenticateToken, authorizeRole} = require('../middlewares/authMiddleware');

router.get('/', authenticateToken, async (req, res) => {
    try {
        const subCategories = await SubCategory.find();
        res.status(200).send(subCategories);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const subCategory = await SubCategory.findById(req.params.id);
        if (!subCategory) {
            return res.status(404).send({ error: 'SubCategory not found' });
        }
        res.status(200).send(subCategory);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

router.post('/', authenticateToken, authorizeRole("Admin"), async (req, res) => {
    try {
        const { name, description, categoryId } = req.body;
        if (!name || !categoryId) {
            return res.status(400).send({ error: 'Missing required fields' });
        }

        const subCategory = new SubCategory({
            name,
            description,
            categoryId
        });

        await subCategory.save();
        res.status(201).send({ message: 'SubCategory is added successfully' }, subCategory);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

router.put('/:id', authenticateToken, authorizeRole("Admin"), async (req, res) => {
    try {
        const subCategory = await SubCategory.findById(req.params.id);
        if (!subCategory) {
            return res.status(404).send({ error: 'SubCategory not found' });
        }

        const { name, description, categoryId } = req.body;
        if (!name || !categoryId) {
            return res.status(400).send({ error: 'Missing required fields' });
        }

        subCategory.name = name;
        if (description) {
            subCategory.description = description;
        }
        subCategory.categoryId = categoryId;

    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

router.delete('/:id', authenticateToken, authorizeRole("Admin"), async (req, res) => {
    try {
        const subCategory = await SubCategory.findById(req.params.id);
        if (!subCategory) {
            return res.status(404).send({ error: 'SubCategory not found' });
        }

        await subCategory.delete();
        res.status(200).send({ message: 'SubCategory deleted successfully' });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});
module.exports = router;