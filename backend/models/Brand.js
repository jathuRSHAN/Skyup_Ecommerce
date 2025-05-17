const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const brandSchema = new Schema({
    name: { type: String, required: true , unique: true},
    description: { type: String},
    logoUrl: { type: String, required: true },
    website: { type: String},
},
{
    timestamps: true
});
// Pre-save hook to set timestamps to IST
brandSchema.pre('save', function (next) {
    const now = new Date();
    const offset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    this.createdAt = new Date(now.getTime() + offset);
    this.updatedAt = new Date(now.getTime() + offset);
    next();
});

const Brand = mongoose.model('Brand', brandSchema);
module.exports = Brand;
