const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
        {
            name: String,
            price: Number,
            quantity: Number,
            options: [String],
            image: String
        }
    ],
    totalAmount: { type: Number, required: true },
    customerName: { type: String, required: true },
    customerAddress: { type: String, required: true },
    customerPhone: { type: String, required: true },
    paymentMethod: { type: String, required: true },
    qrCodePayment: { type: Boolean, default: false }, // True if payment is via QR code
    receiptImage: { type: String }, // Path or URL to receipt image
    paymentStatus: { type: String, default: 'Pending' }, // Set to 'Pending' until reviewed
    paymentVerified: { type: Boolean, default: false }, // Flag for admin verification
    orderDate: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
