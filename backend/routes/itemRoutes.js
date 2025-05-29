const express = require('express');
const router = express.Router();

const Item = require('../models/Item');
const Brand = require('../models/Brand');
const SubCategory = require('../models/SubCategory');
const {authenticateToken, authorizeRole} = require('../middlewares/authMiddleware');
const upload = require('../utils/multerConfig.js');
const cloudinary = require('../utils/cloudinary.js');

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
        if (existingItem) {
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

        // Upload image to Cloudinary
        const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            { folder: 'items' }, // Optional: Store in 'items' folder in Cloudinary
            (error, result) => {
            if (error) return reject(error);
            resolve(result);
            }
        ).end(req.file.buffer);
        });

        const item = new Item({
            name,
            description,
            price,
            subCategoryId: subCategory._id,
            stock,
            brandId: brand._id,
            image: result.secure_url, // Use the secure URL from Cloudinary
            imagePublicId: result.public_id // Store the public ID for future deletion
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

        if (price <= 0) {
            return res.status(400).send({ error: 'Price cannot be negative or zero' });
        }
        if (stock < 0) {
            return res.status(400).send({ error: 'Stock cannot be negative' });
        }

        let imageUrl = existingItem.image; // Keep the existing image URL if no new file is uploaded
        let imagePublicId = existingItem.imagePublicId; // Keep the existing public ID if no new file is uploaded
        
        // If a new file is uploaded, delete the old image from Cloudinary
        if (req.file) {
            // Delete the previous image file if it exists
            if (existingItem.imagePublicId) {
              try {
                await cloudinary.uploader.destroy(existingItem.imagePublicId);
                console.log('Previous image deleted successfully');
              } catch (err) {
                console.error('Error deleting previous image from Cloudinary:', err);
                // Continue even if deletion fails (don't block the update)
              }
            }
    
            // Upload the new image to Cloudinary
            const result = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    { folder: 'items' }, // Optional: Store in 'items' folder in Cloudinary
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result);
                    }
                ).end(req.file.buffer);
            });
            imageUrl = result.secure_url; 
            imagePublicId = result.public_id; 
        }

        

        const item = await Item.findByIdAndUpdate(req.params.id, {
            name,
            description,
            price,
            subCategoryId: subCategory._id,
            stock,
            brandId: brand._id,
            image: imageUrl,
            imagePublicId,
        }, { new: true });


        res.status(200).send(item);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

// Delete item by ID
router.delete('/:id', authenticateToken, authorizeRole("Admin"), async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) {
            return res.status(404).send({ error: 'Item not found' });
        }

        // Delete the image from Cloudinary
        if (item.imagePublicId) {
            try {
                await cloudinary.uploader.destroy(item.imagePublicId);
                console.log('Image deleted successfully from Cloudinary');
            } catch (err) {
                console.error('Error deleting image from Cloudinary:', err);
                // Continue even if deletion fails (don't block the delete operation)
            }
        }

        await Item.findByIdAndDelete(req.params.id);
        res.status(200).send({ message: 'Item deleted successfully' });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

module.exports = router;
