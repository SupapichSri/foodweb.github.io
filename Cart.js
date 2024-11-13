const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: String,
    price: Number,
    quantity: { type: Number, required: true },
    options: [String] // Array to hold customization options like "Rare", "Medium", etc.
});

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;
