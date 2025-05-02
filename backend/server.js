const express = require('express');
<<<<<<< HEAD
// Removed database and related code for simplified backend

const cors = require('cors');
const express = require('express');
const path = require('path');
=======
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
>>>>>>> e88e0ef (Initial commit of The Generics Pharmacy website and backend)

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
<<<<<<< HEAD
=======
app.use(bodyParser.json());
>>>>>>> e88e0ef (Initial commit of The Generics Pharmacy website and backend)

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../TGP-website')));

// Serve index.html on root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../TGP-website/index.html'));
});

<<<<<<< HEAD
=======
// In-memory data stores (replace with DB in production)
const products = [
  { _id: '1', name: 'Generic Medicine A', price: 10.99, description: 'Affordable generic medicine A', image: 'https://via.placeholder.com/150' },
  { _id: '2', name: 'Generic Medicine B', price: 15.49, description: 'Affordable generic medicine B', image: 'https://via.placeholder.com/150' },
  { _id: '3', name: 'Health Product C', price: 7.99, description: 'Quality health product C', image: 'https://via.placeholder.com/150' },
  { _id: '4', name: 'Health Product D', price: 12.99, description: 'Quality health product D', image: 'https://via.placeholder.com/150' },
];

const users = [];

// Secret key for JWT (use env variable in production)
const JWT_SECRET = 'your_jwt_secret_key';

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Missing token' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
}

// API to get products
app.get('/products', (req, res) => {
  res.json(products);
});

// API to register new user
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (users.find(u => u.username === username)) {
    return res.status(409).json({ message: 'Username already exists' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { id: users.length + 1, username, password: hashedPassword };
  users.push(newUser);
  const token = jwt.sign({ username: newUser.username, id: newUser.id }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token, username: newUser.username });
});

// API to login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = jwt.sign({ username: user.username, id: user.id }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token, username: user.username });
});

// API to purchase a product (requires auth)
app.post('/purchase', authenticateToken, (req, res) => {
  const { productId } = req.body;
  const product = products.find(p => p._id === productId);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  // In real app, process payment and order here
  console.log(`User ${req.user.username} purchased product ${product.name}`);
  res.json({ message: 'Purchase successful' });
});

>>>>>>> e88e0ef (Initial commit of The Generics Pharmacy website and backend)
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
