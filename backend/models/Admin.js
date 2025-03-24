const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const adminSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }
},
{
    timestamps: true
});

const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;