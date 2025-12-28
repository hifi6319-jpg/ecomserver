require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const Product = require('./models/Product');
const Invoice = require('./models/Invoice');
const Coupon = require('./models/Coupon');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'nutrimix_super_secret_key_123';

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shop')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));

// --- Auth Routes ---
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, phone, address } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'Email already registered' });

        const user = new User({ name, email, password, phone, address });
        await user.save();

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ token, user: { name, email, phone, address } });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { name: user.name, email: user.email, phone: user.phone, address: user.address } });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- Product Routes ---
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json(products);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/products', async (req, res) => {
    const product = new Product(req.body);
    try {
        const newProduct = await product.save();
        io.emit('products-updated');
        res.status(201).json(newProduct);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

app.put('/api/products/:id', async (req, res) => {
    try {
        const updatedProduct = await Product.findOneAndUpdate(
            { id: parseInt(req.params.id) }, req.body, { new: true }
        );
        io.emit('products-updated');
        res.json(updatedProduct);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        await Product.findOneAndDelete({ id: parseInt(req.params.id) });
        io.emit('products-updated');
        res.json({ message: 'Product deleted' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- Invoice Routes ---
app.get('/api/invoices', async (req, res) => {
    try {
        const invoices = await Invoice.find().sort({ date: -1 });
        res.json(invoices);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/invoices', async (req, res) => {
    try {
        const invoice = new Invoice(req.body);
        const newInvoice = await invoice.save();
        io.emit('invoices-updated');
        res.status(201).json(newInvoice);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

app.delete('/api/invoices/:id', async (req, res) => {
    try {
        await Invoice.findByIdAndDelete(req.params.id);
        io.emit('invoices-updated');
        res.json({ message: 'Invoice deleted' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- Coupon Routes ---
app.get('/api/coupons', async (req, res) => {
    try {
        const coupons = await Coupon.find();
        res.json(coupons);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/coupons', async (req, res) => {
    try {
        const coupon = new Coupon(req.body);
        const newCoupon = await coupon.save();
        io.emit('coupons-updated');
        res.status(201).json(newCoupon);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

app.delete('/api/coupons/:id', async (req, res) => {
    try {
        await Coupon.findByIdAndDelete(req.params.id);
        io.emit('coupons-updated');
        res.json({ message: 'Coupon deleted' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/coupons/validate', async (req, res) => {
    const { code, cartTotal } = req.body;
    try {
        const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
        if (!coupon) return res.status(404).json({ message: 'Invalid coupon' });
        if (cartTotal < coupon.minPurchase) return res.status(400).json({ message: `Min ₹${coupon.minPurchase} needed` });
        res.json(coupon);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
