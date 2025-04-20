const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const cors = require('cors');

const app = express();
const port = 3000;

// Google OAuth client
const clientt = new OAuth2Client("190022392096-gd9ehpmcvfonm496ip6p5ane43q4g4ce.apps.googleusercontent.com");

// MongoDB connection URI
const uri = 'mongodb://localhost:27017/';
const client = new MongoClient(uri);

// MongoDB collections
let usersCollection, profileInfosCollection;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS setup
app.use(cors({
    origin: 'https://shreynik00.github.io',
    credentials: true
}));

// Session middleware
app.use(session({
    secret: 'your-secret-key', // Use a secure secret in production
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true }
}));

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
async function connectDB() {
    try {
        await client.connect();
        const db = client.db('ClothWebsite');
        usersCollection = db.collection('users');
        profileInfosCollection = db.collection('profileInfos'); // ← Add this collection name
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

connectDB();

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// ✅ Get currently logged-in user
app.get('/current-username', (req, res) => {
    try {
        if (req.session.user && req.session.user.username) {
            res.json({ username: req.session.user.username });
        } else {
            res.status(401).json({ message: 'User not logged in.' });
        }
    } catch (error) {
        console.error('Error fetching username:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// ✅ Register a new user
app.post('/register', async (req, res) => {
    const { username, password, email } = req.body;

    try {
        const existingUser = await usersCollection.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already taken' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = { username, password: hashedPassword, email };
        await usersCollection.insertOne(newUser);

        res.json({ message: 'User registered successfully', user: { username, email } });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// ✅ Login user
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await usersCollection.findOne({ username });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.json({ message: 'Invalid username or password.' });
        }

        req.session.user = { username: user.username, email: user.email, _id: user._id };
        res.json({ message: 'Login successful', username: user.username, email: user.email });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// ✅ Get user profile details
app.get('/user/:username', async (req, res) => {
    const { username } = req.params;

    try {
        const user = await profileInfosCollection.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json({
            username: user.username,
            about: user.about || '',
            skills: user.skills || []
        });
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
