const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} else {
  console.warn("WARNING: STRIPE_SECRET_KEY environment variable is not defined. Stripe payments will be bypassed.");
}

const app = express();
app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'data', 'lehenga.json');
const CONFIG_FILE = path.join(__dirname, 'data', 'config.json');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

function readData() {
  if (!fs.existsSync(DATA_FILE)) return [];
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw);
}
function writeData(data) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function readConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    return {
      logoText: "RV creation",
      email: "contact@rvcreation.com",
      phone: "+91 98765 43210",
      address: "123, Fashion Street, Jaipur, Rajasthan, India",
      instagram: "rv_creation_lehengas",
      whatsapp: "+919876543210"
    };
  }
  const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
  return JSON.parse(raw);
}
function writeConfig(config) {
  fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

// Auth endpoint (simple password check)
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    // Return a simple token (in real apps use JWT)
    res.json({ token: 'admin-token' });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

// Get config
app.get('/api/config', (req, res) => {
  res.json(readConfig());
});

// Update config (admin)
app.put('/api/config', (req, res) => {
  const auth = req.headers.authorization;
  if (auth !== 'Bearer admin-token') return res.status(403).json({ error: 'Forbidden' });
  const updates = req.body;
  const current = readConfig();
  const newConfig = { ...current, ...updates };
  writeConfig(newConfig);
  res.json(newConfig);
});

// Get all lehengas
app.get('/api/lehenga', (req, res) => {
  res.json(readData());
});

// Add new lehenga (admin)
app.post('/api/lehenga', (req, res) => {
  const auth = req.headers.authorization;
  if (auth !== 'Bearer admin-token') return res.status(403).json({ error: 'Forbidden' });
  const newItem = req.body;
  const data = readData();
  newItem.id = Date.now();
  data.push(newItem);
  writeData(data);
  res.status(201).json(newItem);
});

// Update lehenga (admin)
app.put('/api/lehenga/:id', (req, res) => {
  const auth = req.headers.authorization;
  if (auth !== 'Bearer admin-token') return res.status(403).json({ error: 'Forbidden' });
  const id = parseInt(req.params.id, 10);
  const updates = req.body;
  let data = readData();
  const idx = data.findIndex(item => item.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  data[idx] = { ...data[idx], ...updates };
  writeData(data);
  res.json(data[idx]);
});

// Delete lehenga (admin)
app.delete('/api/lehenga/:id', (req, res) => {
  const auth = req.headers.authorization;
  if (auth !== 'Bearer admin-token') return res.status(403).json({ error: 'Forbidden' });
  const id = parseInt(req.params.id, 10);
  const data = readData();
  const newData = data.filter(item => item.id !== id);
  writeData(newData);
  res.status(204).end();
});

app.post('/api/create-checkout-session', async (req, res) => {
  const { amount, currency = 'usd', successUrl, cancelUrl } = req.body;
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe is not configured on this server.' });
  }
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price_data: { currency, product_data: { name: 'Lehenga Rental Deposit' }, unit_amount: amount }, quantity: 1 }],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
    res.json({ url: session.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 5000;

// Serve the frontend build (dist folder)
app.use(express.static(path.join(__dirname, 'dist')));

// Catch-all route to serve the React app for all other requests
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
