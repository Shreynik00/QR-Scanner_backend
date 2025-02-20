const express = require('express');
const { MongoClient } = require('mongodb');
const session = require('express-session');
const cors = require('cors');

const app = express();
const port = 3000;
const uri = 'mongodb+srv://Shreynik:Dinku2005@cluster0.xh7s8.mongodb.net/';
const client = new MongoClient(uri);
let usersCollection;
let participants;

app.use(express.json());
app.use(cors({
    origin: 'https://askitindia.github.io',
    credentials: true
}));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true }
}));

async function connectDB() {
    try {
        await client.connect();
        usersCollection = client.db('Freelancer').collection('users');
        participants = client.db('Freelancer').collection('participants');
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}
connectDB();

app.get('/scan', async (req, res) => {
    const { username, email } = req.query;
    if (!username || !email) return res.status(400).json({ success: false, message: "Missing data" });
    try {
        await participants.insertOne({ username, email });
        res.json({ success: true, message: "User added to participants" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Database error" });
    }
});

app.listen(port, () => console.log(`Server running on port ${port}`));
