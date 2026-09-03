import { pool } from "./pool.js";

const emptyHistory = { nodes: [] };

export async function setSession(address, sessionToken) {
    const { rows } = await pool.query(
        `INSERT INTO accounts (address, session_token, history)
     VALUES ($1, $2, $3::jsonb)
     ON CONFLICT (address) DO UPDATE
       SET session_token = EXCLUDED.session_token,
           updated_at = now()
     RETURNING id, address`,
        [address, sessionToken, JSON.stringify(emptyHistory)],
    );
    return rows[0];
}

export async function findBySessionToken(sessionToken) {
    if (!sessionToken) {
        return null;
    }
    const { rows } = await pool.query(
        `SELECT id, address FROM accounts WHERE session_token = $1`,
        [sessionToken],
    );
    return rows[0] ?? null;
}

export async function clearSessionToken(sessionToken) {
    if (!sessionToken) {
        return;
    }
    await pool.query(
        `UPDATE accounts
     SET session_token = NULL, updated_at = now()
     WHERE session_token = $1`,
        [sessionToken],
    );
}
