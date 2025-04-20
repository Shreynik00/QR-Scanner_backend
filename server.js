const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const cors = require('cors');

const app = express();
const port = 3000;

// Connection URI for MongoDB
const clientt = new OAuth2Client("190022392096-gd9ehpmcvfonm496ip6p5ane43q4g4ce.apps.googleusercontent.com");

const uri = 'mongodb://localhost:27017/';
const client = new MongoClient(uri);
let collection, usersCollection;

// Middleware to parse JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
    origin: 'https://shreynik00.github.io/ClothingWebsite/',  // Allow your GitHub Pages site
    methods: ['GET', 'POST', 'PUT', 'DELETE'],  // Allow specific HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'],  // Allow specific headers
    credentials: true  // Allow credentials if needed
}));


// Handle preflight requests
app.options('*', cors());
app.use(session({
    secret: 'your-secret-key', // Replace with a secure secret
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true } // Ensure secure cookies if using HTTPS
}));

// Connect to MongoDB once at the start
async function connectDB() {
    try {
        await client.connect();
        const database = client.db('ClothWebsite');
      
        usersCollection = database.collection('users'); // Users
    
    
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);  // Exit the process if DB connection fails
    }
}

connectDB();

//google sign up 
app.post('/google-login', async (req, res) => {
    const { token } = req.body;

    try {
        const ticket = await clientt.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID || "190022392096-gd9ehpmcvfonm496ip6p5ane43q4g4ce.apps.googleusercontent.com",
});


        const payload = ticket.getPayload();
        const user = {
            googleId: payload.sub,
            username: payload.name,
            email: payload.email,
          
        };

        // Check if user exists in DB
        let existingUser = await usersCollection.findOne({ googleId: user.googleId });

        if (!existingUser) {
            // If user does not exist, insert them into MongoDB
            const result = await usersCollection.insertOne(user);
            existingUser = user;
        }

        res.json({ success: true, user: existingUser });
    } catch (error) {
        console.error("Google login error:", error);
        res.status(401).json({ success: false, error: "Invalid token" });
    }
});

// Google Login Route
app.post('/auth/google', async (req, res) => {
    try {
        const { googleId, email, username } = req.body;
        
        if (!googleId || !email) {
            return res.status(400).json({ success: false, message: "Invalid Google credentials" });
        }

        console.log("Received Google Sign-In Data:", req.body); // Debugging line

        // Check if user exists in MongoDB
        const user = await usersCollection.findOne({ googleId });

        if (!user) {
            // Create a new user if not found
            const newUser = { googleId, email, username };
            await usersCollection.insertOne(newUser);
            return res.json({ success: true, message: "New Google User Registered", user: newUser });
        }

        // User exists, login successful
        res.json({ success: true, message: "Google Login Successful", user });

    } catch (error) {
        console.error("Error during Google authentication:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});


// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve the main HTML file for user setup
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// API to fetch current logged-in username from session
app.get('/current-username', (req, res) => {
    try {
        if (req.session.user && req.session.user.username) {
            res.json({ username: req.session.user.username });
        } else {
            res.status(401).json({ message: 'User not logged in.' });
        }
    // 👇 This is the correct place for closing try block
    } 
    catch (error) {
        console.error('Error fetching username:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});








// API to log in a user
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

// API to fetch user details
// API to fetch user details by username
// API to fetch user details by username
app.get('/user/:username', async (req, res) => {
    const { username } = req.params;
    try {
        const user = await profileInfosCollection.findOne({ username: username });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.json({ username: user.username, about: user.about, skills : user.skills });
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});







// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
