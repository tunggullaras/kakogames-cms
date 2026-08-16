const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';

function requireAuth(req, res, next) {
  const token = req.cookies?.kako_admin_token;
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated. Please log in.' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.admin = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
}

// For page routes (redirect instead of JSON error)
function requireAuthPage(req, res, next) {
  const token = req.cookies?.kako_admin_token;
  if (!token) return res.redirect('/admin/login');
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.admin = payload;
    next();
  } catch (err) {
    return res.redirect('/admin/login');
  }
}

module.exports = { requireAuth, requireAuthPage, JWT_SECRET };
