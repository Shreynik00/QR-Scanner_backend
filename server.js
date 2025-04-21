const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const bodyParser = require('body-parser');

const session = require('express-session');

const app = express();
const port = process.env.PORT || 3000;

// Replace with your MongoDB URI
const mongoURI = 'mongodb+srv://Shreynik:Dinku2005@cluster0.xh7s8.mongodb.net/';
const client = new MongoClient(mongoURI);

// Middleware
app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(bodyParser.json());
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false
}));

let usersCollection,paymentCollection;

// Connect to MongoDB
async function connectToDatabase() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
        const db = client.db('Freelancer');
        usersCollection = db.collection('userC');
         paymentCollection = db.collection('payment');
    } catch (err) {
        console.error("Error connecting to database:", err);
    }
}
connectToDatabase();

// === ROUTES ===

// Home route
app.get('/', (req, res) => {
    res.send('Backend is running!');
});

// REGISTER
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const existingUser = await usersCollection.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

       
        await usersCollection.insertOne({ username, email, password});

        res.status(201).json({ message: 'User registered successfully.' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


app.post('/payment', async (req, res) => {
  const {
    productId,
    quantity,
    totalAmount,
    paymentMethod,
    address,
    upiId,
    cardNumber,
    cardholderName,
    cvv,
    bankName,
    accountHolderName
  } = req.body;

  try {
    // Check required fields for all payments
    if (!productId || !quantity || !totalAmount || !paymentMethod) {
      return res.status(400).json({ message: 'Missing basic payment details.' });
    }

    // Conditional validation based on payment method
    if (paymentMethod === 'Cash on Delivery') {
      if (!address) {
        return res.status(400).json({ message: 'Address is required for Cash on Delivery.' });
      }
    } else if (paymentMethod === 'UPI') {
      if (!upiId) {
        return res.status(400).json({ message: 'UPI ID is required for UPI payment.' });
      }
    } else if (paymentMethod === 'Credit Card') {
      if (!cardNumber || !cardholderName || !cvv) {
        return res.status(400).json({ message: 'Card Number, Cardholder Name, and CVV are required for Credit Card payment.' });
      }
    } else if (paymentMethod === 'Net Banking') {
      if (!bankName || !accountHolderName) {
        return res.status(400).json({ message: 'Bank Name and Account Holder Name are required for Net Banking.' });
      }
    }

    // Save everything that was sent
    const paymentRecord = {
      productId,
      quantity,
      totalAmount,
      paymentMethod,
      address: address || null,
      upiId: upiId || null,
      cardNumber: cardNumber || null,
      cardholderName: cardholderName || null,
      cvv: cvv || null,
      bankName: bankName || null,
      accountHolderName: accountHolderName || null,
      timestamp: new Date()
    };

 await paymentCollection.insertOne(paymentRecord);


    res.status(201).json({ message: 'Payment recorded successfully.' });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// LOGIN (without bcrypt)
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await usersCollection.findOne({ username });

        // Compare plain-text passwords directly
        if (!user || user.password !== password) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        req.session.user = { username: user.username };
        res.json({ message: 'Login successful', user: { username: user.username, email: user.email } });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// LOGOUT
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.json({ message: 'Logged out successfully' });
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
