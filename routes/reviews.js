const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const { status } = req.query;
  const params = [];
  let where = 'WHERE 1=1';
  if (status) {
    params.push(status);
    where += ` AND r.status = $${params.length}`;
  }
  const rows = await pool.query(
    `SELECT r.*, p.name AS product_name
     FROM reviews r LEFT JOIN products p ON p.id = r.product_id
     ${where} ORDER BY r.created_at DESC`,
    params
  );
  res.json({ reviews: rows.rows });
});

router.post('/', async (req, res) => {
  const b = req.body;
  if (!b.reviewer_name || !b.rating) {
    return res.status(400).json({ error: 'Nama reviewer dan rating wajib diisi.' });
  }
  const result = await pool.query(
    `INSERT INTO reviews (product_id, reviewer_name, rating, review_text, status)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [b.product_id || null, b.reviewer_name, b.rating, b.review_text || null, b.status || 'pending']
  );
  res.status(201).json({ review: result.rows[0] });
});

router.put('/:id', async (req, res) => {
  const b = req.body;
  const result = await pool.query(
    `UPDATE reviews SET
      product_id = COALESCE($1, product_id),
      reviewer_name = COALESCE($2, reviewer_name),
      rating = COALESCE($3, rating),
      review_text = $4,
      status = COALESCE($5, status)
     WHERE id = $6 RETURNING *`,
    [b.product_id || null, b.reviewer_name || null, b.rating || null, b.review_text || null, b.status || null, req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Review tidak ditemukan.' });
  res.json({ review: result.rows[0] });
});

router.delete('/:id', async (req, res) => {
  const result = await pool.query('DELETE FROM reviews WHERE id = $1 RETURNING id', [req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Review tidak ditemukan.' });
  res.json({ success: true });
});

module.exports = router;
