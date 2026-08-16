const fmtPrice = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

async function api(path, opts = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) { window.location.href = '/admin/login'; }
    throw new Error(data.error || 'Terjadi kesalahan.');
  }
  return data;
}

/* ---------- AUTH / NAV ---------- */
async function loadMe() {
  try {
    const { admin } = await api('/api/auth/me');
    document.getElementById('adminName').textContent = admin.name || admin.email;
  } catch { window.location.href = '/admin/login'; }
}

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await api('/api/auth/logout', { method: 'POST' });
  window.location.href = '/admin/login';
});

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).style.display = 'block';
  });
});

function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('[data-close]').forEach(el => {
  el.addEventListener('click', () => closeModal(el.dataset.close));
});

/* ---------- PRODUCTS ---------- */
async function loadProducts() {
  const search = document.getElementById('productSearch').value;
  const status = document.getElementById('productStatusFilter').value;
  const params = new URLSearchParams({ search, status });
  const { products } = await api('/api/products?' + params.toString());
  const tbody = document.querySelector('#productsTable tbody');
  tbody.innerHTML = '';
  document.getElementById('productsEmpty').style.display = products.length ? 'none' : 'block';

  products.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><div class="cell-title">${escapeHtml(p.name)}</div><div class="cell-sub">/${escapeHtml(p.slug)}</div></td>
      <td>${escapeHtml(p.brand || '—')}</td>
      <td>${p.discount_price ? `<s style="color:#a39fb0">${fmtPrice(p.price)}</s><br>${fmtPrice(p.discount_price)}` : fmtPrice(p.price)}</td>
      <td>${p.stock}</td>
      <td><span class="status-pill status-${p.status}">${p.status}</span></td>
      <td><div class="row-actions">
        <button class="icon-btn" data-edit="${p.id}">Edit</button>
        <button class="icon-btn danger" data-del="${p.id}">Hapus</button>
      </div></td>`;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => editProduct(b.dataset.edit)));
  tbody.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => deleteProduct(b.dataset.del)));
}

function resetProductForm() {
  document.getElementById('productForm').reset();
  document.getElementById('p_id').value = '';
  document.getElementById('productFormError').style.display = 'none';
  document.getElementById('productModalTitle').textContent = 'Tambah Produk';
}

document.getElementById('addProductBtn').addEventListener('click', () => {
  resetProductForm();
  openModal('productModal');
});

async function editProduct(id) {
  const { product: p } = await api('/api/products/' + id);
  resetProductForm();
  document.getElementById('productModalTitle').textContent = 'Edit Produk';
  document.getElementById('p_id').value = p.id;
  document.getElementById('p_name').value = p.name || '';
  document.getElementById('p_slug').value = p.slug || '';
  document.getElementById('p_brand').value = p.brand || '';
  document.getElementById('p_badge').value = p.badge || '';
  document.getElementById('p_price').value = p.price || '';
  document.getElementById('p_discount_price').value = p.discount_price || '';
  document.getElementById('p_stock').value = p.stock || 0;
  document.getElementById('p_status').value = p.status || 'draft';
  document.getElementById('p_image_url').value = p.image_url || '';
  document.getElementById('p_description').value = p.description || '';
  document.getElementById('p_meta_title').value = p.meta_title || '';
  document.getElementById('p_meta_description').value = p.meta_description || '';
  document.getElementById('p_og_image_url').value = p.og_image_url || '';
  document.getElementById('p_canonical_url').value = p.canonical_url || '';
  openModal('productModal');
}

async function deleteProduct(id) {
  if (!confirm('Hapus produk ini? Tindakan ini tidak bisa dibatalkan.')) return;
  await api('/api/products/' + id, { method: 'DELETE' });
  loadProducts();
}

document.getElementById('productForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errBox = document.getElementById('productFormError');
  errBox.style.display = 'none';
  const id = document.getElementById('p_id').value;
  const body = {
    name: document.getElementById('p_name').value,
    slug: document.getElementById('p_slug').value,
    brand: document.getElementById('p_brand').value,
    badge: document.getElementById('p_badge').value,
    price: document.getElementById('p_price').value,
    discount_price: document.getElementById('p_discount_price').value || null,
    stock: document.getElementById('p_stock').value,
    status: document.getElementById('p_status').value,
    image_url: document.getElementById('p_image_url').value,
    description: document.getElementById('p_description').value,
    meta_title: document.getElementById('p_meta_title').value,
    meta_description: document.getElementById('p_meta_description').value,
    og_image_url: document.getElementById('p_og_image_url').value,
    canonical_url: document.getElementById('p_canonical_url').value,
  };
  try {
    if (id) await api('/api/products/' + id, { method: 'PUT', body: JSON.stringify(body) });
    else await api('/api/products', { method: 'POST', body: JSON.stringify(body) });
    closeModal('productModal');
    loadProducts();
  } catch (err) {
    errBox.textContent = err.message;
    errBox.style.display = 'block';
  }
});

document.getElementById('productSearch').addEventListener('input', debounce(loadProducts, 300));
document.getElementById('productStatusFilter').addEventListener('change', loadProducts);

/* ---------- CONTENT ---------- */
async function loadContent() {
  const search = document.getElementById('contentSearch').value;
  const params = new URLSearchParams({ search });
  const { posts } = await api('/api/content?' + params.toString());
  const tbody = document.querySelector('#contentTable tbody');
  tbody.innerHTML = '';
  document.getElementById('contentEmpty').style.display = posts.length ? 'none' : 'block';

  posts.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><div class="cell-title">${escapeHtml(p.title)}</div><div class="cell-sub">/${escapeHtml(p.slug)}</div></td>
      <td>${escapeHtml(p.year_tag || '—')}</td>
      <td><span class="status-pill status-${p.status}">${p.status}</span></td>
      <td><div class="row-actions">
        <button class="icon-btn" data-edit="${p.id}">Edit</button>
        <button class="icon-btn danger" data-del="${p.id}">Hapus</button>
      </div></td>`;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => editContent(b.dataset.edit)));
  tbody.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => deleteContent(b.dataset.del)));
}

function resetContentForm() {
  document.getElementById('contentForm').reset();
  document.getElementById('c_id').value = '';
  document.getElementById('contentFormError').style.display = 'none';
  document.getElementById('contentModalTitle').textContent = 'Tambah Konten';
}

document.getElementById('addContentBtn').addEventListener('click', () => {
  resetContentForm();
  openModal('contentModal');
});

async function editContent(id) {
  const { post: p } = await api('/api/content/' + id);
  resetContentForm();
  document.getElementById('contentModalTitle').textContent = 'Edit Konten';
  document.getElementById('c_id').value = p.id;
  document.getElementById('c_title').value = p.title || '';
  document.getElementById('c_slug').value = p.slug || '';
  document.getElementById('c_year_tag').value = p.year_tag || '';
  document.getElementById('c_status').value = p.status || 'draft';
  document.getElementById('c_tags').value = (p.tags || []).join(', ');
  document.getElementById('c_image_url').value = p.image_url || '';
  document.getElementById('c_description').value = p.description || '';
  document.getElementById('c_meta_title').value = p.meta_title || '';
  document.getElementById('c_meta_description').value = p.meta_description || '';
  document.getElementById('c_og_image_url').value = p.og_image_url || '';
  document.getElementById('c_canonical_url').value = p.canonical_url || '';
  openModal('contentModal');
}

async function deleteContent(id) {
  if (!confirm('Hapus konten ini?')) return;
  await api('/api/content/' + id, { method: 'DELETE' });
  loadContent();
}

document.getElementById('contentForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errBox = document.getElementById('contentFormError');
  errBox.style.display = 'none';
  const id = document.getElementById('c_id').value;
  const body = {
    title: document.getElementById('c_title').value,
    slug: document.getElementById('c_slug').value,
    year_tag: document.getElementById('c_year_tag').value,
    status: document.getElementById('c_status').value,
    tags: document.getElementById('c_tags').value,
    image_url: document.getElementById('c_image_url').value,
    description: document.getElementById('c_description').value,
    meta_title: document.getElementById('c_meta_title').value,
    meta_description: document.getElementById('c_meta_description').value,
    og_image_url: document.getElementById('c_og_image_url').value,
    canonical_url: document.getElementById('c_canonical_url').value,
  };
  try {
    if (id) await api('/api/content/' + id, { method: 'PUT', body: JSON.stringify(body) });
    else await api('/api/content', { method: 'POST', body: JSON.stringify(body) });
    closeModal('contentModal');
    loadContent();
  } catch (err) {
    errBox.textContent = err.message;
    errBox.style.display = 'block';
  }
});

document.getElementById('contentSearch').addEventListener('input', debounce(loadContent, 300));

/* ---------- REVIEWS ---------- */
async function loadReviews() {
  const { reviews } = await api('/api/reviews');
  const tbody = document.querySelector('#reviewsTable tbody');
  tbody.innerHTML = '';
  document.getElementById('reviewsEmpty').style.display = reviews.length ? 'none' : 'block';

  reviews.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(r.reviewer_name)}</td>
      <td>${escapeHtml(r.product_name || '—')}</td>
      <td>${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</td>
      <td style="max-width:260px;">${escapeHtml((r.review_text || '').slice(0, 80))}${(r.review_text || '').length > 80 ? '…' : ''}</td>
      <td><span class="status-pill status-${r.status}">${r.status}</span></td>
      <td><div class="row-actions">
        ${r.status !== 'published' ? `<button class="icon-btn" data-publish="${r.id}">Publish</button>` : ''}
        <button class="icon-btn danger" data-del="${r.id}">Hapus</button>
      </div></td>`;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('[data-publish]').forEach(b => b.addEventListener('click', async () => {
    await api('/api/reviews/' + b.dataset.publish, { method: 'PUT', body: JSON.stringify({ status: 'published' }) });
    loadReviews();
  }));
  tbody.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
    if (!confirm('Hapus review ini?')) return;
    await api('/api/reviews/' + b.dataset.del, { method: 'DELETE' });
    loadReviews();
  }));
}

/* ---------- UTIL ---------- */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

/* ---------- INIT ---------- */
loadMe();
loadProducts();
loadContent();
loadReviews();
