const express = require('express');
const slugify = require('slugify');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// All product routes require an authenticated admin
router.use(requireAuth);

// GET /api/products  (list, with basic search + pagination)
router.get('/', async (req, res) => {
  const { search = '', status, page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  const params = [];
  let where = 'WHERE 1=1';

  if (search) {
    params.push(`%${search}%`);
    where += ` AND (name ILIKE $${params.length} OR brand ILIKE $${params.length})`;
  }
  if (status) {
    params.push(status);
    where += ` AND status = $${params.length}`;
  }

  params.push(Number(limit), offset);
  const rows = await pool.query(
    `SELECT * FROM products ${where} ORDER BY updated_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  const count = await pool.query(`SELECT COUNT(*) FROM products ${where}`, params.slice(0, params.length - 2));

  res.json({ products: rows.rows, total: Number(count.rows[0].count) });
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  const result = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Produk tidak ditemukan.' });
  res.json({ product: result.rows[0] });
});

// POST /api/products
router.post('/', async (req, res) => {
  const b = req.body;
  if (!b.name || !b.price) {
    return res.status(400).json({ error: 'Nama dan harga produk wajib diisi.' });
  }
  const slug = b.slug ? slugify(b.slug, { lower: true }) : slugify(b.name, { lower: true });

  try {
    const result = await pool.query(
      `INSERT INTO products
        (name, slug, brand, description, price, discount_price, stock, badge, image_url, status,
         meta_title, meta_description, og_image_url, canonical_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        b.name, slug, b.brand || null, b.description || null,
        b.price, b.discount_price || null, b.stock || 0, b.badge || null,
        b.image_url || null, b.status || 'draft',
        b.meta_title || b.name, b.meta_description || null,
        b.og_image_url || b.image_url || null, b.canonical_url || null,
      ]
    );
    res.status(201).json({ product: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Slug sudah dipakai produk lain.' });
    console.error(err);
    res.status(500).json({ error: 'Gagal menyimpan produk.' });
  }
});

// PUT /api/products/:id
router.put('/:id', async (req, res) => {
  const b = req.body;
  const slug = b.slug ? slugify(b.slug, { lower: true }) : undefined;

  try {
    const result = await pool.query(
      `UPDATE products SET
        name = COALESCE($1, name),
        slug = COALESCE($2, slug),
        brand = $3,
        description = $4,
        price = COALESCE($5, price),
        discount_price = $6,
        stock = COALESCE($7, stock),
        badge = $8,
        image_url = $9,
        status = COALESCE($10, status),
        meta_title = $11,
        meta_description = $12,
        og_image_url = $13,
        canonical_url = $14,
        updated_at = now()
       WHERE id = $15
       RETURNING *`,
      [
        b.name || null, slug || null, b.brand || null, b.description || null,
        b.price || null, b.discount_price || null, b.stock ?? null, b.badge || null,
        b.image_url || null, b.status || null,
        b.meta_title || null, b.meta_description || null,
        b.og_image_url || null, b.canonical_url || null,
        req.params.id,
      ]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Produk tidak ditemukan.' });
    res.json({ product: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Slug sudah dipakai produk lain.' });
    console.error(err);
    res.status(500).json({ error: 'Gagal memperbarui produk.' });
  }
});

// DELETE /api/products/:id
router.delete('/:id', async (req, res) => {
  const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Produk tidak ditemukan.' });
  res.json({ success: true });
});

module.exports = router;
