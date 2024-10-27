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
app.use(cors({
  origin: 'http://127.0.0.1:5500',
  methods: 'GET,POST,PUT,DELETE',
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


// Register endpoint
app.post('/register', (req, res) => {
  const { email, password } = req.body;

  // Debugging log to see request data
  console.log('Register request body:', req.body);

  // Simple field validation
  if (!email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Check if user already exists
  const checkQuery = 'SELECT * FROM new_users WHERE email = ?';
  connection.query(checkQuery, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        return res.status(500).json({ error: 'Error hashing password' });
      }

      // Insert new user into the database
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

// USERS

// Example GET route
app.get('/users', (req, res) => {
  const query = 'SELECT id, email, role FROM new_users';
  connection.query(query, (err, results) => {
      if (err) {
          return res.status(500).json({ error: 'Error fetching users' });
      }
      res.status(200).json(results);
  });
});

// Example POST route for adding a user
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

// Update a user
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



// Example DELETE route
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



// Route handlers for Products, Clients, Locations
// -----------------------------------------------

// PRODUCTS

app.get('/products', (req, res) => {
  console.log('Received request for /products');
  const query = 'SELECT * FROM products';
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    console.log('Products fetched:', results);
    if (results.length === 0) {
      return res.status(404).json({ message: 'No products found' });
    }
    res.status(200).json(results);
  });
});


app.post('/products', (req, res) => {
  const { name, description, price, quantity } = req.body;
  const checkQuery = 'SELECT * FROM products WHERE name = ?';
  
  connection.query(checkQuery, [name], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error during product name check' });
    }

    if (results.length > 0) {
      return res.status(400).json({ message: 'Product with this name already exists' });
    }

    const insertQuery = 'INSERT INTO products (name, description, price, quantity) VALUES (?, ?, ?, ?)';
    connection.query(insertQuery, [name, description, price, quantity], (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Error adding product' });
      }
      res.status(201).json({ message: 'Product added successfully', productId: results.insertId });
    });
  });
});

app.put('/products/:id/quantity', (req, res) => {
    const { id } = req.params;  // Extract the product ID from the URL
    const { quantity } = req.body;  // Extract the quantity from the request body

    const updateQuery = 'UPDATE products SET quantity = ? WHERE product_id = ?'; // 'product_id' is the column in your database
    connection.query(updateQuery, [quantity, id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error during quantity update' });
        } else if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json({ message: 'Quantity updated successfully' });
    });
});



app.put('/products/:id', isAdmin, (req, res) => {
  const { id } = req.params;
  const { name, description, price, quantity } = req.body;

  const updateQuery = 'UPDATE products SET name = ?, description = ?, price = ?, quantity = ? WHERE product_id = ?';
  connection.query(updateQuery, [name, description, price, quantity, id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error updating product' });
    } else if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product updated successfully' });
  });
});

app.delete('/products/:id', isAdmin, (req, res) => {
  const { id } = req.params;
  const deleteQuery = 'DELETE FROM products WHERE product_id = ?';

  connection.query(deleteQuery, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error deleting product' });
    } else if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product deleted successfully' });
  });
});

// CLIENTS

app.get('/clients', (req, res) => {
  const query = 'SELECT * FROM clients';
  connection.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Error fetching clients' });
    } else if (results.length === 0) {
      res.status(404).json({ message: 'No clients found' });
    } else {
      res.status(200).json(results);
    }
  });
});

app.post('/clients', (req, res) => {
  const { client_name, contact_email, phone_number, address } = req.body;
  const insertQuery = 'INSERT INTO clients (client_name, contact_email, phone_number, address) VALUES (?, ?, ?, ?)';

  connection.query(insertQuery, [client_name, contact_email, phone_number, address], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error adding client' });
    }
    res.status(201).json({ message: 'Client added successfully', clientId: results.insertId });
  });
});

app.put('/clients/:id', (req, res) => {
  const { id } = req.params;
  const { client_name, contact_email, phone_number, address } = req.body;

  const updateQuery = 'UPDATE clients SET client_name = ?, contact_email = ?, phone_number = ?, address = ? WHERE client_id = ?';
  connection.query(updateQuery, [client_name, contact_email, phone_number, address, id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error updating client' });
    } else if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.status(200).json({ message: 'Client updated successfully' });
  });
});

app.delete('/clients/:id', (req, res) => {
  const { id } = req.params;
  const deleteQuery = 'DELETE FROM clients WHERE client_id = ?';

  connection.query(deleteQuery, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error deleting client' });
    } else if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.status(200).json({ message: 'Client deleted successfully' });
  });
});

// LOCATIONS

app.get('/locations', (req, res) => {
  const query = 'SELECT * FROM inventory_locations';
  connection.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Error fetching inventory locations' });
    } else if (results.length === 0) {
      res.status(404).json({ message: 'No locations found' });
    } else {
      res.status(200).json(results);
    }
  });
});

app.post('/locations', (req, res) => {
  const { location_name, address, city, state, zip_code } = req.body;
  const insertQuery = 'INSERT INTO inventory_locations (location_name, address, city, state, zip_code) VALUES (?, ?, ?, ?, ?)';

  connection.query(insertQuery, [location_name, address, city, state, zip_code], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error adding inventory location' });
    }
    res.status(201).json({ message: 'Inventory location added successfully', locationId: results.insertId });
  });
});

app.put('/locations/:id', (req, res) => {
  const { id } = req.params;
  const { location_name, address, city, state, zip_code } = req.body;

  const updateQuery = 'UPDATE inventory_locations SET location_name = ?, address = ?, city = ?, state = ?, zip_code = ? WHERE location_id = ?';
  connection.query(updateQuery, [location_name, address, city, state, zip_code, id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error updating inventory location' });
    } else if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Location not found' });
    }
    res.status(200).json({ message: 'Location updated successfully' });
  });
});

app.delete('/locations/:id', (req, res) => {
  const { id } = req.params;
  const deleteQuery = 'DELETE FROM inventory_locations WHERE location_id = ?';

  connection.query(deleteQuery, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error deleting location' });
    } else if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Location not found' });
    }
    res.status(200).json({ message: 'Location deleted successfully' });
  });
});

// Server setup
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
