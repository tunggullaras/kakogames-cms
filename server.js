require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const contentRoutes = require('./routes/content');
const reviewRoutes = require('./routes/reviews');
const publicRoutes = require('./routes/public');
const { requireAuthPage } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS: allow the storefront (e.g. hosted on Netlify) to call this API
// from a different domain. Set ALLOWED_ORIGINS in .env as a comma-separated
// list, e.g. "https://kakogames.netlify.app,http://localhost:8888"
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (same-origin, curl, server-to-server)
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/public', publicRoutes);

// Admin pages
app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin/login.html'));
});
app.get('/admin/dashboard', requireAuthPage, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin/dashboard.html'));
});
app.get('/admin', (req, res) => res.redirect('/admin/login'));

app.listen(PORT, () => {
  console.log(`Kakogames CMS running on http://localhost:${PORT}`);
  console.log(`Admin login: http://localhost:${PORT}/admin/login`);
});
