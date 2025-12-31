// index.js

// Load environment variables AT THE VERY TOP
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 

const app = express();
const port = process.env.PORT || 3000;

// --- Mongoose Connection ---
// logic updated to handle Docker/K8s environments better
const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/stylish";
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log(`MongoDB connected successfully to ${mongoURI}`);
}).catch((err) => {
    console.error("MongoDB connection error:", err);
    // Don't exit immediately on dev environments to allow debugging
    // process.exit(1); 
});

app.use(express.json()); 
app.use(express.static(path.join(__dirname, 'public'))); 

// --- Health Check Endpoints ---
app.get("/health", (req, res) => res.status(200).json({ status: "ok", timestamp: new Date().toISOString() }));
app.get("/ready", (req, res) => mongoose.connection.readyState === 1 ? res.status(200).json({ status: "ready" }) : res.status(503).json({ status: "not ready" }));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"), (err) => {
        if (err && !res.headersSent) res.status(500).send("Error loading index.html");
    });
});

// --- Schemas ---
const Schema = mongoose.Schema;

const UserDataSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    phone: String,
    address: String
}, { timestamps: true });
const UserData = mongoose.model("UserData", UserDataSchema);

const PurchaseSchema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserData', required: true },
    products: [{
        productId: String,
        productName: String,
        quantity: Number,
        pricePerItem: Number
    }],
    totalAmount: { type: Number, required: true },
    shippingAddress: String,
    status: { type: String, default: 'Pending' }
}, { timestamps: true });

// NOTE: Keeping collection name 'data' to match your partner's setup
const Purchase = mongoose.model("Purchase", PurchaseSchema, "data");

// --- Auth Middleware ---
const authMiddleware = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) return res.status(401).json({ message: 'No token, authorization denied.' });
    
    try {
        const token = authHeader.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'Token format invalid.' });
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_dev'); // Added fallback for safety
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid.' });
    }
};

// --- ROUTES ---

// 1. Register
app.post("/api/users/register", async (req, res) => {
    try {
        const { name, email, password, phone, address } = req.body;
        if (!name || !email || !password) return res.status(400).json({ message: "Missing fields" });
        
        const existingUser = await UserData.findOne({ email: email.toLowerCase() });
        if (existingUser) return res.status(409).json({ message: "User exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new UserData({ name, email: email.toLowerCase(), password: hashedPassword, phone, address });
        await newUser.save();
        
        res.status(201).json({ message: "User registered", user: { id: newUser._id, email: newUser.email } });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// 2. Login
app.post("/api/users/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await UserData.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(401).json({ message: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

        const payload = { user: { id: user.id, name: user.name, email: user.email } };
        
        jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret_for_dev', { expiresIn: '1h' }, (err, token) => {
            if (err) throw err;
            res.json({ message: "Login successful", token, user: payload.user });
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// 3. Record Purchase (Checkout) - Logic Fixed to use req.user.id
app.post("/api/purchases/record", authMiddleware, async (req, res) => {
    try {
        const { products, totalAmount, shippingAddress } = req.body;
        const userId = req.user.id; // ✅ CORRECT: Getting ID from the logged-in user token

        // Validation
        if (!products || products.length === 0) return res.status(400).json({ message: "Cart is empty" });

        const newPurchase = new Purchase({
            userId,
            products,
            totalAmount,
            shippingAddress: shippingAddress || "Default Address"
        });

        await newPurchase.save();
        console.log(`Purchase saved for user ${userId}`);
        res.status(201).json({ message: "Purchase recorded", purchase: newPurchase });
    } catch (error) {
        console.error("Purchase error:", error);
        res.status(500).json({ message: "Error recording purchase" });
    }
});

// 4. ✅ NEW ROUTE: Get Purchase History (THIS WAS MISSING!)
// This allows the frontend to actually fetch the "Updated" cart/orders
app.get("/api/purchases", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const history = await Purchase.find({ userId }).sort({ createdAt: -1 }); // Newest first
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: "Error fetching history" });
    }
});

// --- Server Start ---
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});