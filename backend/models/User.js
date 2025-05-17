const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

const userSchema = new Schema({
    name: { type: String, required: true },
    email: {
        type: String,
        unique: true,
        lowercase: true,
        required: true,
        validate: {
            validator: function (value) {
                // Regular expression for basic email validation
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            },
            message: props => `${props.value} is not a valid email address!`
        }
    },
    password: {
        type: String,
        required: true,
        validate: {
            validator: function (value) {
                // Minimum 8 characters, at least one uppercase, one lowercase, one number, and one special character
                return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value);
            },
            message: props => `Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character!`
        }
    },
    userType: { type: String, enum:['Customer', 'Admin'], required: true },
    address:{
        street: {type: String, required: true},
        city: {type: String, required: true},
        state: {type: String, required: true},
        zip: {type: Number}
    },
    phone: {
        type: String,
        required: true,
        validate: {
            validator: function (value) {
                // Check if the phone number is exactly 10 digits
                const phoneStr = value.toString();
                return phoneStr.length === 10 && phoneStr.startsWith('0');
            
            },
            message: props => `${props.value} is not a valid 10-digit phone number! that start with 0`
        }
    },
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


userSchema.pre('save', async function(next){
    const user = this;
    if(!user.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;