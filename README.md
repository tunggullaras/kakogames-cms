# Kakogames CMS

Admin dashboard with login, CRUD for Products / Content / Reviews, and SEO fields on each item. Node + Express backend, Postgres (Supabase-compatible) database.

## 1. Setup

```bash
npm install
cp .env.example .env
```

Edit `.env`:
- `DATABASE_URL` — your Postgres or Supabase connection string
- `JWT_SECRET` — any long random string

## 2. Create the database tables

Run the SQL in `db/schema.sql` against your database. With Supabase, paste it into the SQL Editor and run. With plain Postgres:

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

## 3. Create your first admin login

```bash
npm run seed:admin -- "Your Name" you@kakogames.id yourpassword
```

This creates (or updates) an admin account you can log in with.

## 4. (Optional) Load sample products/content/reviews

So the homepage isn't empty when you first show it to someone:

```bash
npm run seed:sample
```

Adds 3 published products, 3 content posts, and 3 reviews. Safe to re-run.

## 5. Run the server

```bash
npm start
```

- **Homepage**: `http://localhost:3000/` — pulls live published products, content, and reviews from the database
- **Admin login**: `http://localhost:3000/admin/login`
- **Admin dashboard**: `http://localhost:3000/admin/dashboard` (redirects to login if not authenticated)

Anything you add/edit/publish in the dashboard shows up on the homepage on refresh — only items with status `published` are shown publicly; `draft` items stay hidden.

## What's included

- **Auth**: email/password login, bcrypt-hashed passwords, JWT stored in an httpOnly cookie, 7-day session.
- **Products CRUD**: name, slug, brand, price, discount price, stock, badge, image, status (draft/published), plus SEO fields (meta title, meta description, OG image, canonical URL).
- **Content CRUD**: for the Instagram-style "Konten Terbaru" cards — title, slug, year/tag, tags, image, description, status, plus the same SEO fields.
- **Reviews**: moderate customer reviews (publish / delete), linked to a product and star rating.
- **Dashboard UI**: single-page admin at `/admin/dashboard` with tabs, search, modals for add/edit, all in the same visual language as the storefront (purple/orange, Plus Jakarta Sans + JetBrains Mono).
- **Live storefront**: the homepage (`/`) fetches published products, content, and reviews from `/api/public/*` on load — no rebuild needed when you publish something new in the dashboard.

## Deploying (backend + homepage on different hosts)

This is a stateful Express server with cookie-based login — it needs to run
on a persistent Node host, **not** Netlify's static/serverless setup. The
recommended split:

- **Backend** (this whole project: API + admin dashboard + login) → Railway or Render
- **Homepage only** → Netlify, using the standalone copy in `netlify-site/`

### 1. Deploy the backend to Railway (or Render)

1. Push this project to a GitHub repo
2. Railway: "New Project" → "Deploy from GitHub repo" → select it
3. Add a Postgres database (Railway can provision one, or point `DATABASE_URL` at Supabase)
4. Set environment variables: `DATABASE_URL`, `JWT_SECRET`, `ALLOWED_ORIGINS` (your Netlify URL, added after step 2 below)
5. Run the schema (`db/schema.sql`) against the database, then `npm run seed:admin` and optionally `npm run seed:sample` (Railway lets you run one-off commands from its dashboard/CLI)
6. You'll get a URL like `https://kakogames-cms.up.railway.app` — this is your API + admin dashboard

Render works the same way (`npm install` build command, `npm start` start command, add a Postgres instance or use Supabase).

### 2. Deploy the homepage to Netlify

See `netlify-site/README.md` — set `API_BASE` in that folder's `index.html` to your Railway URL, then drag-and-drop the folder onto Netlify or connect it via Git.

### 3. Connect them

Set `ALLOWED_ORIGINS` on the backend to your Netlify URL and restart the backend. Now the Netlify-hosted homepage can fetch live data from the Railway-hosted API.

The admin dashboard (`/admin/login`, `/admin/dashboard`) stays on the backend's own URL (e.g. `https://kakogames-cms.up.railway.app/admin/login`) — it isn't part of the Netlify deploy.

## Next steps (not built yet)

- Image upload (currently image fields take a URL — `multer` is already installed and ready to wire up)
- Sitemap.xml auto-generation from published products/content
- Order management UI (the `orders` table exists in the schema but has no routes yet)
- Role-based access if you want more than one admin tier
- Individual product detail pages (homepage currently links "Beli" nowhere — add a `/produk/:slug` page when ready)
