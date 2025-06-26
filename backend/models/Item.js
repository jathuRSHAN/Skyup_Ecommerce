const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const itemSchema = new Schema({
  name: { type: String, required: true, unique: true },
  old_price: { type: Number, required: true },
  new_price: { type: Number, required: true },
  category: { type: String, required: true },
  image: { type: String, required: true },
  stock: { type: Number, required: true, default: 0 }
}, {
  timestamps: true
});

itemSchema.pre('save', function (next) {
  const now = new Date();
  const offset = 5.5 * 60 * 60 * 1000;
  this.createdAt = new Date(now.getTime() + offset);
  this.updatedAt = new Date(now.getTime() + offset);
  next();
});

const Item = mongoose.model('Item', itemSchema);
module.exports = Item;
