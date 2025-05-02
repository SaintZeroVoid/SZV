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
  { id: 1, username: 'user1', email: 'user1@example.com', password: 'password1' },
  { id: 2, username: 'user2', email: 'user2@example.com', password: 'password2' },
  { id: 3, username: 'ZeroVoid', email: 'admin@example.com', password: '1234567890' },
];

// Simple token store for demonstration
let tokens = {};

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

// Login API
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = accounts.find(acc => acc.username === username && acc.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  // Generate a simple token
  const token = crypto.randomBytes(16).toString('hex');
  tokens[token] = user.username;
  res.json({ token });
});

// Middleware to check auth token
function authenticate(req, res, next) {
  const token = req.headers['authorization'];
  if (!token || !tokens[token]) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.user = tokens[token];
  next();
}

// Product APIs
app.get('/products', authenticate, (req, res) => {
  res.json(products);
});

app.post('/products', authenticate, (req, res) => {
  const { name, price } = req.body;
  if (!name || typeof price !== 'number') {
    return res.status(400).json({ error: 'Invalid product data' });
  }
  const newProduct = { id: products.length + 1, name, price };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

app.delete('/products/:id', authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  products = products.filter(p => p.id !== id);
  res.status(204).send();
});

// Reviews API
app.get('/reviews', authenticate, (req, res) => {
  res.json(reviews);
});

// Accounts API
app.get('/accounts', authenticate, (req, res) => {
  res.json(accounts.map(({ password, ...rest }) => rest)); // Do not send passwords
});

app.listen(port, () => {
  console.log(`Email backend server running on port ${port}`);
});
