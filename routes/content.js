const express = require('express');
const slugify = require('slugify');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const { search = '', status } = req.query;
  const params = [];
  let where = 'WHERE 1=1';
  if (search) {
    params.push(`%${search}%`);
    where += ` AND title ILIKE $${params.length}`;
  }
  if (status) {
    params.push(status);
    where += ` AND status = $${params.length}`;
  }
  const rows = await pool.query(`SELECT * FROM content_posts ${where} ORDER BY updated_at DESC`, params);
  res.json({ posts: rows.rows });
});

router.get('/:id', async (req, res) => {
  const result = await pool.query('SELECT * FROM content_posts WHERE id = $1', [req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Konten tidak ditemukan.' });
  res.json({ post: result.rows[0] });
});

router.post('/', async (req, res) => {
  const b = req.body;
  if (!b.title) return res.status(400).json({ error: 'Judul konten wajib diisi.' });
  const slug = b.slug ? slugify(b.slug, { lower: true }) : slugify(b.title, { lower: true });
  const tags = Array.isArray(b.tags) ? b.tags : (b.tags ? String(b.tags).split(',').map(t => t.trim()) : []);

  try {
    const result = await pool.query(
      `INSERT INTO content_posts
        (title, slug, year_tag, description, image_url, tags, status,
         meta_title, meta_description, og_image_url, canonical_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        b.title, slug, b.year_tag || null, b.description || null, b.image_url || null,
        tags, b.status || 'draft',
        b.meta_title || b.title, b.meta_description || null,
        b.og_image_url || b.image_url || null, b.canonical_url || null,
      ]
    );
    res.status(201).json({ post: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Slug sudah dipakai konten lain.' });
    console.error(err);
    res.status(500).json({ error: 'Gagal menyimpan konten.' });
  }
});

router.put('/:id', async (req, res) => {
  const b = req.body;
  const slug = b.slug ? slugify(b.slug, { lower: true }) : undefined;
  const tags = b.tags !== undefined
    ? (Array.isArray(b.tags) ? b.tags : String(b.tags).split(',').map(t => t.trim()))
    : undefined;

  try {
    const result = await pool.query(
      `UPDATE content_posts SET
        title = COALESCE($1, title),
        slug = COALESCE($2, slug),
        year_tag = $3,
        description = $4,
        image_url = $5,
        tags = COALESCE($6, tags),
        status = COALESCE($7, status),
        meta_title = $8,
        meta_description = $9,
        og_image_url = $10,
        canonical_url = $11,
        updated_at = now()
       WHERE id = $12
       RETURNING *`,
      [
        b.title || null, slug || null, b.year_tag || null, b.description || null, b.image_url || null,
        tags || null, b.status || null,
        b.meta_title || null, b.meta_description || null,
        b.og_image_url || null, b.canonical_url || null,
        req.params.id,
      ]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Konten tidak ditemukan.' });
    res.json({ post: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Slug sudah dipakai konten lain.' });
    console.error(err);
    res.status(500).json({ error: 'Gagal memperbarui konten.' });
  }
});

router.delete('/:id', async (req, res) => {
  const result = await pool.query('DELETE FROM content_posts WHERE id = $1 RETURNING id', [req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Konten tidak ditemukan.' });
  res.json({ success: true });
});

module.exports = router;
