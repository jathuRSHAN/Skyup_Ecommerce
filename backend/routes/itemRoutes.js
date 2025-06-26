const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const upload = require('../utils/multerConfig.js');
const cloudinary = require('../utils/cloudinary.js');
const fs = require('fs');
const path = require('path');

// ✅ Get latest 8 items
router.get('/newcollection', async (req, res) => {
  try {
    const items = await Item.find().sort({ _id: -1 }).limit(8);
    res.status(200).send(items);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// ✅ Get all items
router.get('/', async (req, res) => {
  try {
    const items = await Item.find();
    res.status(200).send(items);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// ✅ Get item by ID
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).send({ error: 'Item not found' });
    res.status(200).send(item);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// ✅ Create new item with Cloudinary upload
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { name, new_price, old_price, category, stock } = req.body;

    if (!name || !new_price || !old_price || !category || !req.file || stock === undefined) {
      return res.status(400).send({ error: 'Missing required fields' });
    }

    const existingItem = await Item.findOne({ name });
    if (existingItem) {
      return res.status(400).send({ error: 'Item with this name already exists' });
    }

    // Upload image to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'items' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      ).end(req.file.buffer);
    });

    const item = new Item({
      name,
      new_price,
      old_price,
      category,
      stock: Number(stock),
      image: uploadResult.secure_url,
      imagePublicId: uploadResult.public_id,
    });

    await item.save();
    res.status(201).send(item);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// ✅ Update item by ID with Cloudinary image replacement
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { name, new_price, old_price, category, stock } = req.body;

    const existingItem = await Item.findById(req.params.id);
    if (!existingItem) return res.status(404).send({ error: 'Item not found' });

    let imageUrl = existingItem.image;
    let imagePublicId = existingItem.imagePublicId;

    if (req.file) {
      // Delete old image from Cloudinary if it exists
      if (existingItem.imagePublicId) {
        try {
          await cloudinary.uploader.destroy(existingItem.imagePublicId);
        } catch (err) {
          console.error('Error deleting previous image from Cloudinary:', err);
        }
      }

      // Upload new image to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'items' },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        ).end(req.file.buffer);
      });

      imageUrl = uploadResult.secure_url;
      imagePublicId = uploadResult.public_id;
    }

    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      {
        name,
        new_price,
        old_price,
        category,
        stock: Number(stock),
        image: imageUrl,
        imagePublicId,
      },
      { new: true }
    );

    res.status(200).send(updatedItem);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// ✅ Delete item by ID and remove image from Cloudinary
router.delete('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).send({ error: 'Item not found' });

    if (item.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(item.imagePublicId);
      } catch (err) {
        console.error('Error deleting image from Cloudinary:', err);
      }
    }

    await Item.findByIdAndDelete(req.params.id);
    res.status(200).send({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

module.exports = router;
