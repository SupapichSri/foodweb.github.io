const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    options: {
        type: [String],
        default: []
    }
});

// Static method to modify a menu item by ID
menuItemSchema.statics.modify = async function (id, updateData) {
    try {
        const updatedItem = await this.findByIdAndUpdate(id, updateData, { new: true });
        return updatedItem;
    } catch (error) {
        console.error("Error modifying menu item:", error);
        throw error;
    }
};

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

module.exports = MenuItem;
