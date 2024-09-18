
const express = require('express');
const jwt = require('jsonwebtoken');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const port = 5000;

// Secret key for JWT signing (replace with a strong, secure value)
const secretKey = process.env.JWT_SECRET_KEY || 'your-very-secret-key';

// MongoDB connection URI
const mongoUri = 'mongodb://rizonrahat199:gpeYJ3jTyAALnHAr@ac-jif2aos-shard-00-00.u9sh80h.mongodb.net:27017,ac-jif2aos-shard-00-01.u9sh80h.mongodb.net:27017,ac-jif2aos-shard-00-02.u9sh80h.mongodb.net:27017/?ssl=true&replicaSet=atlas-rzyffr-shard-0&authSource=admin&retryWrites=true&w=majority'; // Replace with your MongoDB URI
const client = new MongoClient(mongoUri, { useUnifiedTopology: true });

app.use(express.json());
app.use(cors());

client.connect().then(() => {
  const db = client.db('mydatabase');
  const usersCollection = db.collection('users');
  const mealsCollection = db.collection('meals');
  const totalsCollection = db.collection('totals');
  const bazarCollection = db.collection('bazars');
  
    // Get meals data
    app.get('/meals', async (req, res) => {
      const meals = await mealsCollection.findOne({});
      res.json(meals);
    });
  
    // Get total meal and payment data
    app.get('/totals', async (req, res) => {
      const totals = await totalsCollection.find({}).toArray();
      res.json(totals);
    });
  
    // Get bazar data
    app.get('/bazars', async (req, res) => {
      const bazars = await bazarCollection.find({}).toArray();
      res.json(bazars);
    });
  
  
  
  // Register route
  app.post('/register', async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    try {
      // Check if the user already exists
      const existingUser = await usersCollection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash the password before storing
      const hashedPassword = await bcrypt.hash(password, 10);
      await usersCollection.insertOne({ email, password: hashedPassword, role });
      res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });

  // Login route
  app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    try {
      const user = await usersCollection.findOne({ email });
      
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials: User not found' });
      }

      // Compare the password with the hashed password in the database
      const isPasswordMatch = await bcrypt.compare(password, user.password);
      if (!isPasswordMatch) {
        return res.status(401).json({ message: 'Invalid credentials: Wrong password' });
      }

      // Generate JWT token
      const token = jwt.sign({ userId: user._id, role: user.role }, secretKey, { expiresIn: '1h' });
      res.json({ token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });

  // Middleware to verify JWT
  const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, secretKey, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // Middleware to check roles
  const authorizeRole = (roles) => (req, res, next) => {
    console.log("====req===",req);
    console.log("====req user===",req.user);
    if (roles.includes(req.user.role)) {
      next();
    } else {
      res.sendStatus(403); // Forbidden
    }
  };

  // Protected dashboard routes
  app.get('/dashboard', authenticateToken, (req, res) => {
    res.send('Welcome to the Dashboard');
  });

  // Admin dashboard (accessible by admin and super admin)
  app.get('/admin', authenticateToken, authorizeRole(['admin', 'super admin']), (req, res) => {
    res.send('Welcome to the Admin Dashboard');
  });

  // Super Admin dashboard (accessible only by super admin)
  app.get('/super-admin', authenticateToken, authorizeRole(['super admin']), (req, res) => {
    res.send('Welcome to the Super Admin Dashboard');
  });

  // Start the server
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
});
