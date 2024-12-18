// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const path = require('path');
const { body, validationResult } = require('express-validator');
const cors = require('cors');
const mysql = require('mysql2');

// Load environment variables from .env file
dotenv.config();

// Initialize express app
const app = express();

// Enable CORS
const allowedOrigins = ['http://127.0.0.1:5500', 'https://sheltered-ocean-88352-000ba16da54d.herokuapp.com'];
app.use(cors({
    origin: function (origin, callback) {
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

// Parse the JAWSDB_URL into MySQL configuration
const dbUrl = process.env.JAWSDB_URL;
const url = new URL(dbUrl);

const pool = mysql.createPool({
  host: url.hostname,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
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

    const { company, email, password } = req.body;
    const query = `
        SELECT new_users.*, companies.name AS company_name 
        FROM new_users 
        JOIN companies ON new_users.company_id = companies.id 
        WHERE new_users.email = ? AND companies.name = ?`;

    pool.query(query, [email, company], (err, results) => {
        if (err) {
            console.error('Database error during login:', err);
            return res.status(500).json({ error: 'Internal server error - Database query failed' });
        }
        if (results.length > 0) {
            const user = results[0];
            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) {
                    console.error('Error comparing passwords:', err);
                    return res.status(500).json({ error: 'Internal server error - Password comparison failed' });
                }
                if (isMatch) {
                    console.log("Login successful for email:", email);
                    res.status(200).json({
                        message: 'Login successful',
                        user: { email: user.email, role: user.role, company: user.company_name }
                    });
                } else {
                    console.log("Password mismatch for email:", email);
                    res.status(401).json({ message: 'Invalid email, password, or company' });
                }
            });
        } else {
            console.log("No user found with email and company:", email, company);
            res.status(401).json({ message: 'Invalid email, password, or company' });
        }
    });
});


// Registration route
app.post('/register', async (req, res) => {
    const { companyName, email, password } = req.body;

    try {
        // Check if the company already exists
        let companyResult = await pool.promise().query('SELECT id FROM companies WHERE name = ?', [companyName]);
        let companyId;

        if (companyResult[0].length === 0) {
            // Create a new company if it doesn't exist
            const newCompanyResult = await pool.promise().query('INSERT INTO companies (name) VALUES (?)', [companyName]);
            companyId = newCompanyResult[0].insertId;
        } else {
            companyId = companyResult[0][0].id;
        }

        // Hash the password before storing it
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert a new user into the new_users table associated with the company
        const userResult = await pool.promise().query(
            'INSERT INTO new_users (email, password, company_id) VALUES (?, ?, ?)', 
            [email, hashedPassword, companyId]
        );

        res.status(201).json({ userId: userResult[0].insertId });
    } catch (error) {
        console.error('Error during registration:', error); // Log full error details
        res.status(500).json({ error: 'Registration failed', details: error.message });
    }
});


// USER MANAGEMENT ROUTES
app.get('/users', (req, res) => {
    const query = 'SELECT id, email, role FROM new_users';
    pool.query(query, (err, results) => {
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
    pool.query(query, [email, hashedPassword, role], (err, results) => {
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
    pool.query(updateQuery, [email, role, id], (err, results) => {
        if (err) {
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
    pool.query(query, [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error deleting user' });
        } else if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User deleted successfully' });
    });
});

// PRODUCTS ROUTES
app.get('/products', (req, res) => {
    const query = 'SELECT * FROM products';
    pool.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(200).json(results);
    });
});

app.post('/products', (req, res) => {
    const { name, description, price, quantity } = req.body;
    const checkQuery = 'SELECT * FROM products WHERE name = ?';

    pool.query(checkQuery, [name], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error during product name check' });
        }
        if (results.length > 0) {
            return res.status(400).json({ message: 'Product with this name already exists' });
        }
        const insertQuery = 'INSERT INTO products (name, description, price, quantity) VALUES (?, ?, ?, ?)';
        pool.query(insertQuery, [name, description, price, quantity], (err) => {
            if (err) {
                return res.status(500).json({ error: 'Error adding product' });
            }
            res.status(201).json({ message: 'Product added successfully' });
        });
    });
});

app.put('/products/:id/quantity', (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;

    const updateQuery = 'UPDATE products SET quantity = ? WHERE product_id = ?';
    pool.query(updateQuery, [quantity, id], (err, results) => {
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
    pool.query(updateQuery, [name, description, price, quantity, id], (err, results) => {
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

    pool.query(deleteQuery, [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error deleting product' });
        } else if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json({ message: 'Product deleted successfully' });
    });
});

// CLIENTS ROUTES
app.get('/clients', (req, res) => {
    const query = 'SELECT * FROM clients';
    pool.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching clients' });
        }
        res.status(200).json(results);
    });
});

app.post('/clients', (req, res) => {
    const { client_name, contact_email, phone_number, address } = req.body;
    const insertQuery = 'INSERT INTO clients (client_name, contact_email, phone_number, address) VALUES (?, ?, ?, ?)';

    pool.query(insertQuery, [client_name, contact_email, phone_number, address], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Error adding client' });
        }
        res.status(201).json({ message: 'Client added successfully' });
    });
});

app.put('/clients/:id', (req, res) => {
    const { id } = req.params;
    const { client_name, contact_email, phone_number, address } = req.body;

    const updateQuery = 'UPDATE clients SET client_name = ?, contact_email = ?, phone_number = ?, address = ? WHERE client_id = ?';
    pool.query(updateQuery, [client_name, contact_email, phone_number, address, id], (err, results) => {
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

    pool.query(deleteQuery, [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error deleting client' });
        } else if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Client not found' });
        }
        res.status(200).json({ message: 'Client deleted successfully' });
    });
});

// LOCATIONS ROUTES
app.get('/locations', (req, res) => {
    const query = 'SELECT * FROM inventory_locations';
    pool.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching inventory locations' });
        }
        res.status(200).json(results);
    });
});

app.post('/locations', (req, res) => {
    const { location_name, address, city, state, zip_code } = req.body;
    const insertQuery = 'INSERT INTO inventory_locations (location_name, address, city, state, zip_code) VALUES (?, ?, ?, ?, ?)';

    pool.query(insertQuery, [location_name, address, city, state, zip_code], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Error adding inventory location' });
        }
        res.status(201).json({ message: 'Inventory location added successfully' });
    });
});

app.put('/locations/:id', (req, res) => {
    const { id } = req.params;
    const { location_name, address, city, state, zip_code } = req.body;

    const updateQuery = 'UPDATE inventory_locations SET location_name = ?, address = ?, city = ?, state = ?, zip_code = ? WHERE location_id = ?';
    pool.query(updateQuery, [location_name, address, city, state, zip_code, id], (err, results) => {
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

    pool.query(deleteQuery, [id], (err, results) => {
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