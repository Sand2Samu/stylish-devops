// index.js

// Load environment variables AT THE VERY TOP, ONLY ONCE
require('dotenv').config();

// DEBUGGING LINE - To check if JWT_SECRET is loaded
console.log("Value of JWT_SECRET after dotenv config:", process.env.JWT_SECRET);
// To see all loaded env vars (optional, can be noisy):
// console.log("All loaded environment variables by dotenv:", process.env);

// Require modules ONCE
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs'); // For password hashing
const jwt = require('jsonwebtoken'); // For JWT

// Initialize Express app ONCE
const app = express();
const port = process.env.PORT || 3000;

// --- Mongoose Connection (ONCE) ---
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/stylish", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("MongoDB connected successfully");
}).catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit if DB connection fails
});

// --- Middleware (Applied ONCE to the app instance) ---
app.use(express.json()); // To parse JSON request bodies
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 0, etag: false })); // To serve static files - caching disabled

// DEBUG: Check file paths
const fs = require('fs');
app.get("/debug/paths", (req, res) => {
    const publicDir = path.join(__dirname, 'public');
    const scriptPath = path.join(publicDir, 'js', 'Script2.js');
    let fileContent = '';
    try {
        fileContent = fs.readFileSync(scriptPath, 'utf8').substring(0, 500);
    } catch (e) {
        fileContent = 'Error: ' + e.message;
    }
    res.json({
        __dirname: __dirname,
        publicDir: publicDir,
        scriptPath: scriptPath,
        fileExists: fs.existsSync(scriptPath),
        fileContentStart: fileContent
    });
});

// --- Health Check Endpoints for Kubernetes ---
// Liveness probe - checks if the app is running
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Readiness probe - checks if the app is ready to receive traffic
app.get("/ready", async (req, res) => {
    try {
        // Check MongoDB connection
        const dbState = mongoose.connection.readyState;
        if (dbState === 1) { // 1 = connected
            res.status(200).json({
                status: "ready",
                database: "connected",
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(503).json({
                status: "not ready",
                database: "disconnected",
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        res.status(503).json({
            status: "not ready",
            error: error.message
        });
    }
});

// --- Route to serve your index.html (from the project root) ---
app.get("/", (req, res) => {
    const filePath = path.join(__dirname, "index.html");
    res.sendFile(filePath, function (err) {
        if (err) {
            console.error("Error sending index.html:", err);
            if (!res.headersSent) {
                res.status(err.status || 500).send("Internal Server Error: Could not send index.html");
            }
        }
    });
});

// --- Mongoose Schemas and Models ---
const Schema = mongoose.Schema;

// UserData Schema
const UserDataSchema = new Schema({
    name: {
        type: String,
        required: [true, "Name is required"]
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/\S+@\S+\.\S+/, 'Please use a valid email address.']
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters long"]
    },
    phone: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    }
}, { timestamps: true });
const UserData = mongoose.model("UserData", UserDataSchema); // Collection will be 'userdata'

// Purchase Schema
const PurchaseSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserData', // Links to the UserData model
        required: [true, "User ID is required for a purchase"]
    },
    products: [{
        productId: {
            type: String, // Or mongoose.Schema.Types.ObjectId if you have a Product model
            required: [true, "Product ID is required"]
        },
        productName: {
            type: String,
            required: [true, "Product name is required"]
        },
        quantity: {
            type: Number,
            required: [true, "Quantity is required"],
            min: [1, "Quantity must be at least 1"]
        },
        pricePerItem: {
            type: Number,
            required: [true, "Price per item is required"]
        }
    }],
    totalAmount: {
        type: Number,
        required: [true, "Total amount is required"]
    },
    purchaseDate: {
        type: Date,
        default: Date.now
    },
    shippingAddress: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Pending'
    }
}, { timestamps: true });
// Explicitly naming the collection "data" for purchases
const Purchase = mongoose.model("Purchase", PurchaseSchema, "data");


// --- Authentication Middleware ---
const authMiddleware = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
        return res.status(401).json({ message: 'No token, authorization denied. Header missing.' });
    }

    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
        return res.status(401).json({ message: 'Token format must be "Bearer <token>", authorization denied.' });
    }
    const token = tokenParts[1];

    if (!token) { // Should be caught by above, but good check
        return res.status(401).json({ message: 'No token provided after "Bearer", authorization denied.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user; // Contains id, name, email from JWT payload
        next();
    } catch (err) {
        console.error("Token verification failed:", err.message);
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token is malformed or invalid.' });
        }
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token has expired.' });
        }
        return res.status(401).json({ message: 'Token is not valid for an unknown reason.' });
    }
};


// --- API Route: Register a new user ---
app.post("/api/users/register", async (req, res) => {
    console.log("--- /api/users/register route hit ---");
    try {
        const { name, email, password, phone, address } = req.body;
        console.log("Received registration data:", req.body);

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email, and password are required." });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long." });
        }

        const existingUser = await UserData.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            console.log("User already exists with email:", email.toLowerCase());
            return res.status(409).json({ message: "User with this email already exists." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        console.log("Password hashed for email:", email.toLowerCase());

        const newUser = new UserData({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            phone,
            address
        });
        await newUser.save();
        console.log("--- !!! USER SAVED SUCCESSFULLY to MongoDB !!! --- User ID:", newUser._id);
        return res.status(201).json({
            message: "User registered successfully. Please login.",
            user: { id: newUser._id, name: newUser.name, email: newUser.email } // Don't send password back
        });

    } catch (error) {
        console.error("--- !!! ERROR in /api/users/register route !!! ---:", error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            if (!res.headersSent) return res.status(400).json({ message: messages.join(' ') });
        } else if (error.code === 11000) { // Mongoose duplicate key error
            if (!res.headersSent) return res.status(409).json({ message: "User with this email already exists (duplicate key)." });
        } else {
            if (!res.headersSent) return res.status(500).json({ message: "Server error during registration." });
        }
    }
});

// --- API Route: Login an existing user ---
app.post("/api/users/login", async (req, res) => {
    console.log("--- /api/users/login route hit ---");
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        const user = await UserData.findOne({ email: email.toLowerCase() });
        if (!user) {
            console.log("Login attempt failed: User not found for email:", email.toLowerCase());
            return res.status(401).json({ message: "Invalid credentials. User not found." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log("Login attempt failed: Password mismatch for user:", user.email);
            return res.status(401).json({ message: "Invalid credentials. Password incorrect." });
        }

        console.log("Login successful for user:", user.email);
        const payload = {
            user: { id: user.id, name: user.name, email: user.email } // Information to store in JWT
        };

        // Check if JWT_SECRET is loaded before signing
        if (!process.env.JWT_SECRET) {
            console.error("FATAL ERROR: JWT_SECRET is not defined. Cannot sign token.");
            return res.status(500).json({ message: "Server configuration error: Cannot sign token." });
        }

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' }, // Token expires in 1 hour
            (err, token) => {
                if (err) {
                    console.error("Error signing JWT:", err);
                    // This throw will be caught by the outer try-catch if it's an unexpected error
                    // For known jwt errors, they might have specific names to check
                    return res.status(500).json({ message: "Could not sign token." });
                }
                console.log("JWT generated successfully for user:", user.email);
                res.json({
                    message: "Login successful",
                    token: token,
                    user: { id: user.id, name: user.name, email: user.email }
                });
            }
        );
    } catch (error) {
        console.error("--- !!! ERROR in /api/users/login route !!! ---:", error);
        if (!res.headersSent) { // Ensure response is sent only once
            return res.status(500).json({ message: "Server error during login." });
        }
    }
});

// --- API Route: Record a new purchase (Protected Route) ---
app.post("/api/purchases/record", authMiddleware, async (req, res) => {
    console.log("--- /api/purchases/record route hit ---");
    try {
        const { products, totalAmount, shippingAddress } = req.body;
        const userId = req.user.id; // From authMiddleware, contains the logged-in user's ID

        console.log("Received purchase data for user ID:", userId, "Data:", req.body);

        // Basic Validation
        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ message: "Products array is required and cannot be empty." });
        }
        if (typeof totalAmount !== 'number' || totalAmount <= 0) {
            return res.status(400).json({ message: "A valid total amount is required." });
        }

        // More detailed validation for each product
        for (const product of products) {
            if (!product.productId || !product.productName || typeof product.quantity !== 'number' || product.quantity < 1 || typeof product.pricePerItem !== 'number' || product.pricePerItem < 0) {
                return res.status(400).json({ message: "Each product in the purchase must have valid details (productId, productName, quantity, pricePerItem)." });
            }
        }

        let finalShippingAddress = shippingAddress;
        if (!finalShippingAddress) {
            const user = await UserData.findById(userId).select('address'); // Only select the address field
            if (user && user.address) {
                finalShippingAddress = user.address;
                console.log("Using user's default address for shipping:", finalShippingAddress);
            } else {
                console.log("No shipping address provided with order and no default address found for user ID:", userId);
                // Decide if shipping address is strictly mandatory
                // For now, we'll allow it to be null if not found and not provided
            }
        }

        const newPurchase = new Purchase({
            userId,
            products,
            totalAmount,
            shippingAddress: finalShippingAddress,
            // status will default to 'Pending' as per schema
        });

        console.log("New Purchase object created:", newPurchase);
        await newPurchase.save(); // This saves to the "data" collection
        console.log("--- !!! PURCHASE SAVED SUCCESSFULLY to MongoDB ('data' collection) !!! --- Purchase ID:", newPurchase._id);

        res.status(201).json({
            message: "Purchase recorded successfully.",
            purchase: newPurchase
        });

    } catch (error) {
        console.error("--- !!! ERROR in /api/purchases/record route !!! ---:", error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            if (!res.headersSent) return res.status(400).json({ message: messages.join(' ') });
        } else {
            if (!res.headersSent) return res.status(500).json({ message: "Server error while recording purchase." });
        }
    }
});


// --- Start the Server (ONCE) ---
const dbConnection = mongoose.connection;
dbConnection.on('error', (err) => {
    console.error('MongoDB runtime connection error:', err);
});

dbConnection.once('open', function () {
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
        console.log("MongoDB connection open and ready.");
    });
});

// Graceful shutdown (ONCE)
process.on('SIGINT', async () => {
    console.log('SIGINT signal received. Closing HTTP server and MongoDB connection...');
    // Close server first to stop accepting new connections
    const server = app.get('server'); // We'd need to store the server instance if we want to close it gracefully
    // For now, just closing DB and exiting.
    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed.');
        process.exit(0);
    } catch (err) {
        console.error('Error during shutdown:', err);
        process.exit(1);
    }
});