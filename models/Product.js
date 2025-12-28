const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    salePrice: { type: Number }, // For display showing discounts
    offerType: { type: String }, // e.g., "Trending", "BOGO", "10% OFF"
    description: { type: String },
    category: { type: String },
    image: { type: String },
    rating: { type: Number, default: 4.5 },
    reviews: { type: Number, default: 0 },
    specs: [String],
    ingredients: [String],
    uses: [String],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
