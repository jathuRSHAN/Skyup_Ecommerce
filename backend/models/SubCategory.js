const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const subCategorySchema = new Schema({
    name: { type: String, required: true },
    description: { type: String},
    categoryId: { type: Schema.Types.ObjectId, ref:'Category' , required: true },
},
{
    timestamps: true
});

// Pre-save hook to set timestamps to IST
subCategorySchema.pre('save', function (next) {
    const now = new Date();
    const offset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    this.createdAt = new Date(now.getTime() + offset);
    this.updatedAt = new Date(now.getTime() + offset);
    next();
});

const SubCategory = mongoose.model('SubCategory', subCategorySchema);
module.exports = SubCategory;