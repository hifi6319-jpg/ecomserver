require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'nutrimix_super_secret_key_123';

// Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
app.use(express.json());

// --- Helper Functions for Data Transformation ---
// Mongoose used _id, Supabase uses id or _id depending on table. 
// We try to normalize response to match frontend expectations.

// --- Auth Routes ---
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, phone, address } = req.body;

        // Check existing
        const { data: existing } = await supabase.from('users').select('*').eq('email', email).single();
        if (existing) return res.status(400).json({ message: 'Email already registered' });

        const hashedPassword = await bcrypt.hash(password, 10);

        const { data: user, error } = await supabase
            .from('users')
            .insert([{ name, email, password: hashedPassword, phone, address }])
            .select()
            .single();

        if (error) throw error;

        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ token, user: { name, email, phone, address } });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const { data: user, error } = await supabase.from('users').select('*').eq('email', email).single();

        if (error || !user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { name: user.name, email: user.email, phone: user.phone, address: user.address } });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- Product Routes ---
app.get('/api/products', async (req, res) => {
    try {
        const { data: products, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        res.json(products);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/products', async (req, res) => {
    try {
        const { data: newProduct, error } = await supabase.from('products').insert([req.body]).select().single();
        if (error) throw error;
        io.emit('products-updated');
        res.status(201).json(newProduct);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

app.put('/api/products/:id', async (req, res) => {
    try {
        const { data: updatedProduct, error } = await supabase
            .from('products')
            .update(req.body)
            .eq('id', parseInt(req.params.id))
            .select()
            .single();
        if (error) throw error;
        io.emit('products-updated');
        res.json(updatedProduct);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        const { error } = await supabase.from('products').delete().eq('id', parseInt(req.params.id));
        if (error) throw error;
        io.emit('products-updated');
        res.json({ message: 'Product deleted' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- Invoice Routes ---
app.get('/api/invoices', async (req, res) => {
    try {
        const { data: invoices, error } = await supabase.from('invoices').select('*').order('date', { ascending: false });
        if (error) throw error;
        res.json(invoices);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/invoices', async (req, res) => {
    try {
        // Remove _id if passed from frontend as Mongo auto-generates it, but Supabase also generates it
        const { _id, ...invoiceData } = req.body;
        const { data: newInvoice, error } = await supabase.from('invoices').insert([invoiceData]).select().single();
        if (error) throw error;
        io.emit('invoices-updated');
        res.status(201).json(newInvoice);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

app.delete('/api/invoices/:id', async (req, res) => {
    try {
        const { error } = await supabase.from('invoices').delete().eq('_id', req.params.id);
        if (error) throw error;
        io.emit('invoices-updated');
        res.json({ message: 'Invoice deleted' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- Coupon Routes ---
app.get('/api/coupons', async (req, res) => {
    try {
        const { data: coupons, error } = await supabase.from('coupons').select('*');
        if (error) throw error;
        res.json(coupons);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/coupons', async (req, res) => {
    try {
        const { _id, ...couponData } = req.body;
        const { data: newCoupon, error } = await supabase.from('coupons').insert([couponData]).select().single();
        if (error) throw error;
        io.emit('coupons-updated');
        res.status(201).json(newCoupon);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

app.delete('/api/coupons/:id', async (req, res) => {
    try {
        const { error } = await supabase.from('coupons').delete().eq('_id', req.params.id);
        if (error) throw error;
        io.emit('coupons-updated');
        res.json({ message: 'Coupon deleted' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/coupons/validate', async (req, res) => {
    const { code, cartTotal } = req.body;
    try {
        const { data: coupon, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('code', code.toUpperCase())
            .eq('isActive', true)
            .single();

        if (error || !coupon) return res.status(404).json({ message: 'Invalid coupon' });
        if (cartTotal < coupon.minPurchase) return res.status(400).json({ message: `Min ₹${coupon.minPurchase} needed` });
        res.json(coupon);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
