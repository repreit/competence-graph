import { pool } from "./pool.js";

const emptyHistory = { nodes: [] };

export async function setSession(address, sessionToken, expiresAt) {
    const { rows } = await pool.query(
        `INSERT INTO accounts (address, session_token, session_expires_at, history)
     VALUES ($1, $2, $3, $4::jsonb)
     ON CONFLICT (address) DO UPDATE
       SET session_token = EXCLUDED.session_token,
           session_expires_at = EXCLUDED.session_expires_at,
           updated_at = now()
     RETURNING id, address`,
        [address, sessionToken, expiresAt, JSON.stringify(emptyHistory)],
    );
    return rows[0];
}

export async function findBySessionToken(sessionToken) {
    if (!sessionToken) {
        return null;
    }
    const { rows } = await pool.query(
        `SELECT id, address FROM accounts
     WHERE session_token = $1 AND session_expires_at > now()`,
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
     SET session_token = NULL, session_expires_at = NULL, updated_at = now()
     WHERE session_token = $1`,
        [sessionToken],
    );
}
