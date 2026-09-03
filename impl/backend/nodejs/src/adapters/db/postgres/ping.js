import { pool } from "./pool.js";

try {
  const { rows } = await pool.query(`
    SELECT
      version() AS version,
      current_database() AS database,
      current_user AS role
  `);
  console.log(rows[0]);
} finally {
  await pool.end();
}
