import crypto from 'node:crypto';
import process from 'node:process';
import pg from 'pg';

const { Pool } = pg;

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const username = process.env.ADMIN_USERNAME || 'admin';
  const fullName = process.env.ADMIN_FULL_NAME || 'System Administrator';
  const password = process.env.ADMIN_PASSWORD;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  if (!password) {
    throw new Error('ADMIN_PASSWORD is required');
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const passwordHash = hashPassword(password);
    const userRes = await client.query(
      `
      INSERT INTO app_users (username, full_name, password_hash, is_active)
      VALUES ($1, $2, $3, TRUE)
      ON CONFLICT (username) DO UPDATE
      SET full_name = EXCLUDED.full_name,
          password_hash = EXCLUDED.password_hash,
          is_active = TRUE
      RETURNING id
      `,
      [username, fullName, passwordHash],
    );

    const roleRes = await client.query(
      `SELECT id FROM app_roles WHERE role_name = 'admin' LIMIT 1`,
    );

    if (roleRes.rowCount === 0) {
      throw new Error("Role 'admin' not found. Run db/002_seed_rbac.sql first.");
    }

    await client.query(
      `
      INSERT INTO app_user_roles (user_id, role_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, role_id) DO NOTHING
      `,
      [userRes.rows[0].id, roleRes.rows[0].id],
    );

    await client.query('COMMIT');
    console.log(`Admin user '${username}' is ready.`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
