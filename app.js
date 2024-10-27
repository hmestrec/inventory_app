// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const path = require('path');
const { body, validationResult } = require('express-validator');
const cors = require('cors');

// Load environment variables from .env file
dotenv.config();

// Initialize express app
const app = express();

// Enable CORS
const allowedOrigins = ['http://127.0.0.1:5500', 'https://sheltered-ocean-88352-000ba16da54d.herokuapp.com'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: 'GET,POST,PUT,DELETE'
}));

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Create a database connection directly from environment variables
const mysql = require('mysql2');
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
  } else {
    console.log('Connected to MySQL');
  }
});

// Define isAdmin function for role-based access control
const isAdmin = (req, res, next) => {
  const userRole = 'admin';  // Hard-code this for testing purposes
  if (userRole === 'admin') {
    next();  // User is admin, proceed
  } else {
    res.status(403).json({ message: 'Access denied: Admins only' });
  }
};

// LOGIN ROUTE
app.post('/login', (req, res) => {
  console.log("Received login request with email:", req.body.email);

  const { email, password } = req.body;
  const query = 'SELECT * FROM new_users WHERE email = ?';

  connection.query(query, [email], (err, results) => {
    if (err) {
      console.error('Database error during login:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    if (results.length > 0) {
      const user = results[0];
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (isMatch) {
          console.log("Login successful for email:", email);
          res.status(200).json({
            message: 'Login successful',
            user: { email: user.email, role: user.role }
          });
        } else {
          console.log("Password mismatch for email:", email);
          res.status(401).json({ message: 'Invalid email or password' });
        }
      });
    } else {
      console.log("No user found with email:", email);
      res.status(401).json({ message: 'Invalid email or password' });
    }
  });
});

// REGISTER ROUTE
app.post('/register', (req, res) => {
  const { email, password } = req.body;

  console.log('Register request body:', req.body);

  if (!email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const checkQuery = 'SELECT * FROM new_users WHERE email = ?';
  connection.query(checkQuery, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        return res.status(500).json({ error: 'Error hashing password' });
      }

      const insertQuery = 'INSERT INTO new_users (email, password, role) VALUES (?, ?, ?)';
      connection.query(insertQuery, [email, hash, 'user'], (err, results) => {
        if (err) {
          return res.status(500).json({ error: 'Error registering user' });
        }
        res.status(201).json({ message: 'User registered successfully' });
      });
    });
  });
});

// USER MANAGEMENT ROUTES
app.get('/users', (req, res) => {
  const query = 'SELECT id, email, role FROM new_users';
  connection.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching users' });
    }
    res.status(200).json(results);
  });
});

app.post('/users', (req, res) => {
  const { email, password, role } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  const query = 'INSERT INTO new_users (email, password, role) VALUES (?, ?, ?)';
  connection.query(query, [email, hashedPassword, role], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error adding user' });
    }
    res.status(201).json({ message: 'User added successfully', userId: results.insertId });
  });
});

app.put('/users/:id', (req, res) => {
  const { id } = req.params;
  const { email, role } = req.body;

  const updateQuery = 'UPDATE new_users SET email = ?, role = ? WHERE id = ?';
  connection.query(updateQuery, [email, role, id], (err, results) => {
    if (err) {
      console.error('Error updating user:', err);
      return res.status(500).json({ error: 'Error updating user' });
    } else if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User updated successfully' });
  });
});

app.delete('/users/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM new_users WHERE id = ?';
  connection.query(query, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error deleting user' });
    } else if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted successfully' });
  });
});

// Server setup
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
