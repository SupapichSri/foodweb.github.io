const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    isAdmin: {
        type: Boolean,
        default: false // New field to indicate admin status
    }
});

// Pre-save hook to hash the password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next(); // Only hash if password is new or modified
    try {
        this.password = await bcrypt.hash(this.password, 10);
        next();
    } catch (err) {
        next(err);
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
