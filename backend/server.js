const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your email address
    pass: process.env.EMAIL_PASS, // Your email password or app password
  },
});

// In-memory storage for demonstration
let products = [];
let reviews = [
  { id: 1, user: 'John Doe', comment: 'Great product!', rating: 5 },
  { id: 2, user: 'Jane Smith', comment: 'Good value for money.', rating: 4 },
];
let accounts = [
  { id: 1, username: 'user1', email: 'user1@example.com', password: 'password1', role: 'programmer' },
  { id: 2, username: 'user2', email: 'user2@example.com', password: 'password2', role: 'employee' },
  { id: 3, username: 'ZeroVoid', email: 'admin@example.com', password: '1234567890', role: 'programmer' },
];
let customers = [];

let orders = [];

let tokens = {};

// Helper function to generate tokens
function generateToken() {
  return crypto.randomBytes(16).toString('hex');
}

// Middleware to check auth token and role
function authenticate(role) {
  return (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token || !tokens[token]) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = tokens[token];
    if (role) {
      if (Array.isArray(role)) {
        if (!role.includes(user.role)) {
          return res.status(403).json({ error: 'Forbidden' });
        }
      } else if (user.role !== role) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }
    req.user = user;
    next();
  };
}

app.post('/send-order-confirmation', (req, res) => {
  const { to, subject, text } = req.body;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).json({ success: false, error: error.toString() });
    }
    res.json({ success: true, info });
  });
});

// Admin login API
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  const user = accounts.find(acc => acc.username === username && acc.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = generateToken();
  tokens[token] = { username: user.username, role: user.role };
  res.json({ token, role: user.role });
});

// Customer registration API
app.post('/customer/register', (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  if (customers.find(c => c.username === username || c.email === email)) {
    return res.status(400).json({ error: 'User already exists' });
  }
  const newCustomer = { id: customers.length + 1, username, email, password, role: 'customer' };
  customers.push(newCustomer);
  res.status(201).json({ message: 'Customer registered successfully' });
});

// Customer login API
app.post('/customer/login', (req, res) => {
  const { username, password } = req.body;
  const user = customers.find(c => c.username === username && c.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = generateToken();
  tokens[token] = { username: user.username, role: 'customer' };
  res.json({ token, role: 'customer' });
});

// Product APIs (programmer and employee only)
app.get('/products', authenticate(['programmer', 'employee']), (req, res) => {
  res.json(products);
});

app.post('/products', authenticate(['programmer', 'employee']), (req, res) => {
  const { name, price } = req.body;
  if (!name || typeof price !== 'number') {
    return res.status(400).json({ error: 'Invalid product data' });
  }
  const newProduct = { id: products.length + 1, name, price };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

app.delete('/products/:id', authenticate(['programmer', 'employee']), (req, res) => {
  const id = parseInt(req.params.id);
  products = products.filter(p => p.id !== id);
  res.status(204).send();
});

// Reviews API (programmer and employee only)
app.get('/reviews', authenticate(['programmer', 'employee']), (req, res) => {
  res.json(reviews);
});

// Accounts API (programmer and employee only)
app.get('/accounts', authenticate(['programmer', 'employee']), (req, res) => {
  res.json(accounts.map(({ password, ...rest }) => rest));
});

// Customer products API (public)
app.get('/shop/products', (req, res) => {
  res.json(products);
});

// Purchase API (customer only)
app.post('/purchase', authenticate('customer'), (req, res) => {
  const { productId } = req.body;
  const product = products.find(p => p.id === productId);
  if (!product) {
    return res.status(400).json({ error: 'Product not found' });
  }
  // Save order
  const order = {
    id: orders.length + 1,
    productId,
    productName: product.name,
    username: req.user.username,
    status: 'Processing',
    orderDate: new Date().toISOString(),
  };
  orders.push(order);
  res.json({ message: `Purchase successful for product ${product.name}`, orderId: order.id });
});

// Customer order history API
app.get('/orders', authenticate('customer'), (req, res) => {
  const userOrders = orders.filter(o => o.username === req.user.username);
  res.json(userOrders);
});

// Customer order tracking API
app.get('/orders/:id', authenticate('customer'), (req, res) => {
  const orderId = parseInt(req.params.id);
  const order = orders.find(o => o.id === orderId && o.username === req.user.username);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json(order);
});

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});
