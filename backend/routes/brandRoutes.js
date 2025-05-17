const express = require('express');
const router = express.Router();

const Brand = require('../models/Brand');
const {authenticateToken, authorizeRole} = require('../middlewares/authMiddleware');

// Get all brands
router.get('/', authenticateToken, async (req,res)=>{
    try {
        const brands = await Brand.find();
        res.status(200).send(brands);
    } catch (error) {
        res.status(500).send({error: error.message});
    }
});

// Get brand by ID
router.get('/:id', authenticateToken, async (req,res)=>{
    try {
        const brand = await Brand.findById(req.params.id);
        if(!brand){
            return res.status(404).send({error: 'Brand not found'});
        }
        res.status(200).send(brand);
    } catch (error) {
        res.status(500).send({error: error.message});
    }
});

// Create a new brand
router.post('/', authenticateToken, authorizeRole("Admin"), async (req,res)=>{
    try {
        const {name, description, logoUrl, website} = req.body;
        if(!name || !logoUrl){
            return res.status(400).send({error: 'Missing required fields'});
        }

        const brand = new Brand({
            name,
            description,
            logoUrl,
            website
        });

        await brand.save();
        res.status(201).send(brand);
    } catch (error) {
        res.status(500).send({error: error.message});
    }

});

// Update a brand
router.put('/:id', authenticateToken, authorizeRole("Admin"), async (req, res) => {
    try {
        const brand = await Brand.findById(req.params.id);
        if (!brand) {
            return res.status(404).send({ error: 'Brand not found' });
        }

        const { name, description, logoUrl, website } = req.body;
        if (name) {
            brand.name = name;
        }
        if (description) {
            brand.description = description;
        }
        if (logoUrl) {
            brand.logoUrl = logoUrl;
        }
        if (website) {
            brand.website = website;
        }

        await brand.save();
        res.status(200).send(brand);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// Delete a brand
router.delete('/:id', authenticateToken, authorizeRole("Admin"), async (req, res) => {
    try {
        const brand = await Brand.findByIdAndDelete(req.params.id);
        if (!brand) {
            return res.status(404).send({ error: 'Brand not found' });
        }
        res.status(200).send({ message: 'Brand deleted successfully' });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

module.exports = router;

