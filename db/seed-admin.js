// Run: node db/seed-admin.js "Admin Name" admin@kakogames.id yourpassword
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./pool');

async function main() {
  const [name, email, password] = process.argv.slice(2);
  if (!name || !email || !password) {
    console.log('Usage: node db/seed-admin.js "Admin Name" email@example.com password');
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT INTO admins (name, email, password_hash)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE SET password_hash = $3, name = $1`,
    [name, email, hash]
  );
  console.log(`Admin account ready: ${email}`);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
