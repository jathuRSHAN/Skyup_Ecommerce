const express = require('express');
const router = express.Router();

const Item = require('../models/Item');
const Brand = require('../models/Brand');
const SubCategory = require('../models/SubCategory');
const {authenticateToken, authorizeRole} = require('../middlewares/authMiddleware');
const upload = require('../utils/multerConfig.js');

const fs = require('fs');
const path = require('path');

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
router.post('/', authenticateToken, authorizeRole("Admin"), upload.single('image'), async (req, res) => {
    try {
        const { name, description, price, subCategoryName, stock, brandName } = req.body;
        if (!name || !description || !price || !subCategoryName || !stock || !brandName ) {
            return res.status(400).send({ error: 'Missing required fields' });
        }

        const existingItem = await Item.findOne({ name });
        if (existingItem.length > 0) {
            return res.status(400).send({ error: 'Item with this name already exists' });
        }

        if (price <= 0) {
            return res.status(400).send({ error: 'Price cannot be negative' });
        }
        if (stock <= 0) {
            return res.status(400).send({ error: 'Stock cannot be negative' });
        }

        const brand = await Brand.findOne({ name: brandName });
        if (!brand) {
            return res.status(404).send({ error: 'Brand not found' });
        }

        const subCategory = await SubCategory.findOne({ name: subCategoryName });
        if (!subCategory) {
            return res.status(404).send({ error: 'SubCategory not found' });
        }

        if (!req.file) {
            return res.status(400).send({ error: 'Image file is required' });
        }

        const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        const image = imageUrl ; 

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
        res.status(201).send(item);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

// Update item by ID
router.put('/:id', authenticateToken, authorizeRole("Admin"), upload.single('image') , async (req, res) => {
    try {
        const { name, description, price, subCategoryName, stock, brandName} = req.body;
        if (!name || !description || !price || !subCategoryName || !stock || !brandName ) {
            return res.status(400).send({ error: 'Missing required fields' });
        }

        const existingItem = await Item.findById(req.params.id);
        if (!existingItem) {
            return res.status(404).send({ error: 'Item not found' });
        }

        const brand = await Brand.findOne({ name: brandName });
        if (!brand) {
            return res.status(404).send({ error: 'Brand not found' });
        }

        const subCategory = await SubCategory.findOne({ name: subCategoryName });
        if (!subCategory) {
            return res.status(404).send({ error: 'SubCategory not found' });
        }

        let imageUrl = existingItem.image; // Keep the existing image URL if no new file is uploaded
        if (req.file) {
            // Delete the previous image file if it exists
            if (existingItem.image) {
              try {
                const filename = existingItem.image.split('/uploads/')[1];
                const filePath = path.join(__dirname, '../uploads', filename);
                fs.unlinkSync(filePath); // Delete the file
              } catch (err) {
                console.error('Error deleting previous image:', err);
                // Continue even if deletion fails (don't block the update)
              }
            }
    
            // Generate new image URL
            imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
          }

        if (price <= 0) {
            return res.status(400).send({ error: 'Price cannot be negative or zero' });
        }
        if (stock < 0) {
            return res.status(400).send({ error: 'Stock cannot be negative' });
        }

        const item = await Item.findByIdAndUpdate(req.params.id, {
            name,
            description,
            price,
            subCategoryId: subCategory._id,
            stock,
            brandId: brand._id,
            image: imageUrl,
        }, { new: true });


        res.status(200).send(item);
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
