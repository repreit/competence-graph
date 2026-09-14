import { assertLink, hashContent } from "../../../../../../common/js/delta.js";
import { pool } from "./pool.js";

export async function findTip(accountId, client = pool) {
    const { rows } = await client.query(
        `SELECT seq, prev_hash, content, signature
     FROM deltas
     WHERE account_id = $1
     ORDER BY seq DESC
     LIMIT 1`,
        [accountId],
    );
    return rows[0] ?? null;
}

export async function appendDelta(accountId, row, client = pool) {
    const tip = await findTip(accountId, client);
    const seq = tip ? tip.seq + 1 : 1;
    const prev_hash = tip ? await hashContent(tip.content) : null;
    const next = {
        seq,
        prev_hash,
        content: row.content,
        signature: row.signature,
    };
    const link = await assertLink(tip, next);
    if (!link.ok) {
        return { ok: false, error: link.error };
    }
    const { rows } = await client.query(
        `INSERT INTO deltas (account_id, seq, prev_hash, content, signature)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, account_id, seq, prev_hash, content, signature, received_at`,
        [accountId, seq, prev_hash, row.content, row.signature],
    );
    return { ok: true, row: rows[0] };
}
