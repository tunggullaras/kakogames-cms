# Kakogames Homepage — Netlify deploy

This folder is a standalone copy of the storefront homepage, meant to be
deployed to Netlify **separately** from the backend (which should be deployed
to Railway, Render, or similar — see the main project's README).

## Before deploying

Open `index.html`, find this line near the bottom (inside the `<script>` tag):

```js
const API_BASE = ''; // e.g. 'https://kakogames-cms.up.railway.app'
```

Set it to your deployed backend's URL, e.g.:

```js
const API_BASE = 'https://kakogames-cms.up.railway.app';
```

## Deploy to Netlify

**Drag and drop (fastest):**
1. Go to https://app.netlify.com/drop
2. Drag this whole `netlify-site` folder in
3. Done — you'll get a live URL immediately

**Or via Git:**
1. Push this folder (or the whole repo) to GitHub
2. In Netlify: "Add new site" → "Import an existing project"
3. Set publish directory to `netlify-site` (or `.` if this is its own repo)
4. Deploy

## Also required: allow this domain on the backend

On your backend host (Railway/Render), set the `ALLOWED_ORIGINS` environment
variable to your Netlify URL, e.g.:

```
ALLOWED_ORIGINS=https://kakogames.netlify.app
```

Without this, the browser will block the homepage's requests to the backend
(CORS). Redeploy/restart the backend after setting it.
