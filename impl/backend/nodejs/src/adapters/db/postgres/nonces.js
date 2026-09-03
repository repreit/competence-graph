import { pool } from "./pool.js";

export async function insertNonce(nonce, expiresAt) {
    await pool.query(`DELETE FROM nonces WHERE expires_at <= now()`);
    await pool.query(
        `INSERT INTO nonces (nonce, expires_at) VALUES ($1, $2)`,
        [nonce, expiresAt],
    );
}

export async function nonceIsValid(nonce) {
    if (!nonce) {
        return false;
    }
    const { rows } = await pool.query(
        `SELECT 1 FROM nonces WHERE nonce = $1 AND expires_at > now()`,
        [nonce],
    );
    return rows.length > 0;
}

export async function consumeNonce(nonce) {
    if (!nonce) {
        return false;
    }
    const { rowCount } = await pool.query(
        `DELETE FROM nonces WHERE nonce = $1 AND expires_at > now()`,
        [nonce],
    );
    return rowCount > 0;
}
