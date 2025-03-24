const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const itemSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    subCategoryId: { type: Schema.Types.ObjectId, ref:'subCategory' , required: true },
    stock: { type: Number, required: true },
    brandId: { type: Schema.Types.ObjectId, ref:'Brand' },
    image: { type: String, required: true },
},
{
    timestamps: true
});

// Pre-save hook to set timestamps to IST
userSchema.pre('save', function (next) {
    const now = new Date();
    const offset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    this.createdAt = new Date(now.getTime() + offset);
    this.updatedAt = new Date(now.getTime() + offset);
    next();
});

const Item = mongoose.model('Item', itemSchema);
module.exports = Item;