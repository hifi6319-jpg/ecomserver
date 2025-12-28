const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    invoiceNo: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    shippingAddress: { type: String },
    billingAddress: { type: String },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    shippingCharge: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMode: { type: String, required: true },
    welcomeNote: { type: String },
    fromAddress: { type: String },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Invoice', invoiceSchema);
