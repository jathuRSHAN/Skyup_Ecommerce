const express = require('express');
const router = express.Router();

const Category = require('../models/Category');
const {authenticateToken, authorizeRole} = require('../middlewares/authMiddleware');

router.get('/', authenticateToken, async (req, res) => {
    try {
        const categories = await Category.find();
        res.status(200).send(categories);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).send({ error: 'Category not found' });
        }
        res.status(200).send(category);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

router.post('/', authenticateToken, authorizeRole("Admin"), async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).send({ error: 'Missing required fields' });
        }

        const category = new Category({
            name,
            description
        });

        await category.save();
        res.status(201).send({message: 'category is added sucsesfully'},category);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

router.put('/:id', authenticateToken, authorizeRole("Admin"), async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).send({ error: 'Category not found' });
        }

        const { name, description } = req.body;
        if (!name) {
            return res.status(400).send({ error: 'Missing required fields' });
        }

        category.name = name;
        if (description) {
            brand.description = description; // Skips null, undefined, and ""
        }

        await category.save();
        res.status(200).send({message: 'category is updated sucsesfully'},category);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

router.delete('/:id', authenticateToken, authorizeRole("Admin"), async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).send({ error: 'Category not found' });
        }

        await category.remove();
        res.status(200).send({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

module.exports = router;