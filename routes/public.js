const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

// GET /api/public/products — published products only
router.get('/products', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, slug, brand, description, price, discount_price, stock, badge, image_url
       FROM products WHERE status = 'published' ORDER BY updated_at DESC LIMIT 24`
    );
    res.json({ products: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal memuat produk.' });
  }
});

// GET /api/public/content — published content posts only
router.get('/content', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, slug, year_tag, description, image_url, tags
       FROM content_posts WHERE status = 'published' ORDER BY updated_at DESC LIMIT 12`
    );
    res.json({ posts: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal memuat konten.' });
  }
});

// GET /api/public/reviews — published reviews only
router.get('/reviews', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.id, r.reviewer_name, r.rating, r.review_text, r.created_at, p.name AS product_name
       FROM reviews r LEFT JOIN products p ON p.id = r.product_id
       WHERE r.status = 'published' ORDER BY r.created_at DESC LIMIT 12`
    );
    res.json({ reviews: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal memuat review.' });
  }
});

module.exports = router;
