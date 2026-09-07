import { pool } from "./pool.js";

export async function setSession(address, sessionToken, expiresAt) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const { rows } = await client.query(
            `INSERT INTO accounts (address)
       VALUES ($1)
       ON CONFLICT (address) DO UPDATE
         SET updated_at = now()
       RETURNING id, address`,
            [address],
        );
        const account = rows[0];
        await client.query(`DELETE FROM sessions WHERE account_id = $1`, [
            account.id,
        ]);
        await client.query(
            `INSERT INTO sessions (account_id, token, expires_at)
       VALUES ($1, $2, $3)`,
            [account.id, sessionToken, expiresAt],
        );
        await client.query("COMMIT");
        return account;
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}

export async function findBySessionToken(sessionToken) {
    if (!sessionToken) {
        return null;
    }
    const { rows } = await pool.query(
        `SELECT a.id, a.address
     FROM sessions s
     JOIN accounts a ON a.id = s.account_id
     WHERE s.token = $1 AND s.expires_at > now()`,
        [sessionToken],
    );
    return rows[0] ?? null;
}

export async function clearSessionToken(sessionToken) {
    if (!sessionToken) {
        return;
    }
    await pool.query(`DELETE FROM sessions WHERE token = $1`, [sessionToken]);
}
