const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
const port = 3000;

// MongoDB connection
const uri = 'mongodb://localhost:27017/';
const client = new MongoClient(uri);
let usersCollection;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({
    origin: 'https://shreynik00.github.io',
    credentials: true
}));

// Handle preflight requests
app.options('*', cors());

// Session configuration
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true }
}));

// Connect to MongoDB
async function connectDB() {
    try {
        await client.connect();
        const database = client.db('ClothWebsite');
        usersCollection = database.collection('users');
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

connectDB();

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

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

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await usersCollection.findOne({ username });
        if (!user || !(await bcrypt.compare(password, user
::contentReference[oaicite:18]{index=18}
 
