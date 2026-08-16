// Run: node db/seed-sample-data.js
// Adds a few published products, content posts, and reviews so the
// storefront homepage has something to show right away.
require('dotenv').config();
const pool = require('./pool');
const slugify = require('slugify');

const products = [
  {
    name: 'RG Rotate', brand: 'Anbernic', badge: 'Anbernic',
    description: 'Handheld retro dengan layar rotate 360°, cocok untuk game arcade vertikal maupun horizontal.',
    price: 2300000, discount_price: 2050000, stock: 12,
    image_url: 'https://images.unsplash.com/photo-1606318801954-d46d46d3360a?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'RG 35XXSP', brand: 'Anbernic', badge: 'Anbernic',
    description: 'Clamshell handheld gaya Game Boy Advance SP dengan performa modern.',
    price: 1750000, discount_price: null, stock: 8,
    image_url: 'https://images.unsplash.com/photo-1585678468170-42fd41f2e4d4?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Miyoo Mini Plus', brand: 'Miyoo', badge: 'Miyoo',
    description: 'Handheld mungil dengan layar tajam, favorit untuk koleksi game klasik ringan.',
    price: 990000, discount_price: null, stock: 20,
    image_url: 'https://images.unsplash.com/photo-1617096199330-72a5ce3d7e77?auto=format&fit=crop&w=600&q=80',
  },
];

const posts = [
  {
    title: 'Anbernic RG SP', year_tag: '2025 · RG 34XXSP',
    description: 'Dual-stick clamshell handheld tanpa aba-aba. Penyempurnaan dari RG35XXSP yang bikin gamer retro jatuh cinta lagi.',
    tags: ['H700', 'Dual Alloy Hinges'],
    image_url: 'https://images.unsplash.com/photo-1580327344181-c1163234e5a0?auto=format&fit=crop&w=500&q=80',
  },
  {
    title: 'Unboxing RG Rotate', year_tag: '2025 · UNBOXING',
    description: 'Kemasan metalik yang bikin penasaran — lihat apa saja isi paket lengkap RG Rotate dari Kakogames.',
    tags: ['Unboxing'],
    image_url: 'https://images.unsplash.com/photo-1591370874773-6702e8f12fd8?auto=format&fit=crop&w=500&q=80',
  },
  {
    title: '5 Tips Merawat Handheld', year_tag: '2025 · TIPS',
    description: 'Biar handheld retro kesayangan awet dan performanya tetap optimal untuk jangka panjang.',
    tags: ['Panduan'],
    image_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=500&q=80',
  },
];

async function main() {
  console.log('Seeding sample products...');
  const productIds = [];
  for (const p of products) {
    const slug = slugify(p.name, { lower: true });
    const result = await pool.query(
      `INSERT INTO products (name, slug, brand, badge, description, price, discount_price, stock, image_url, status, meta_title, meta_description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'published',$1,$5)
       ON CONFLICT (slug) DO UPDATE SET
         brand=$3, badge=$4, description=$5, price=$6, discount_price=$7, stock=$8, image_url=$9, status='published', updated_at=now()
       RETURNING id`,
      [p.name, slug, p.brand, p.badge, p.description, p.price, p.discount_price, p.stock, p.image_url]
    );
    productIds.push(result.rows[0].id);
  }

  console.log('Seeding sample content...');
  for (const c of posts) {
    const slug = slugify(c.title, { lower: true });
    await pool.query(
      `INSERT INTO content_posts (title, slug, year_tag, description, image_url, tags, status, meta_title, meta_description)
       VALUES ($1,$2,$3,$4,$5,$6,'published',$1,$4)
       ON CONFLICT (slug) DO UPDATE SET
         year_tag=$3, description=$4, image_url=$5, tags=$6, status='published', updated_at=now()`,
      [c.title, slug, c.year_tag, c.description, c.image_url, c.tags]
    );
  }

  console.log('Seeding sample reviews...');
  const reviews = [
    { product_id: productIds[0], reviewer_name: 'Dimas P.', rating: 5, review_text: 'Layar rotate-nya mulus banget, build quality premium. Worth the price!' },
    { product_id: productIds[1], reviewer_name: 'Sarah W.', rating: 4, review_text: 'Nostalgia GBA SP tapi lebih modern. Baterai awet seharian.' },
    { product_id: productIds[2], reviewer_name: 'Rizky A.', rating: 5, review_text: 'Ukurannya pas di saku, cocok buat main sambil nunggu di mana pun.' },
  ];
  for (const r of reviews) {
    await pool.query(
      `INSERT INTO reviews (product_id, reviewer_name, rating, review_text, status)
       VALUES ($1,$2,$3,$4,'published')`,
      [r.product_id, r.reviewer_name, r.rating, r.review_text]
    );
  }

  console.log('Sample data ready. Refresh the homepage to see it.');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
