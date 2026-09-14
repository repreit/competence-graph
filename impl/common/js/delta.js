const encoder = new TextEncoder();

function hex(buffer) {
    const bytes = new Uint8Array(buffer);
    let out = "";
    for (const byte of bytes) {
        out += byte.toString(16).padStart(2, "0");
    }
    return out;
}

function isSeq(seq) {
    return Number.isSafeInteger(seq) && seq >= 1;
}

function isPrevHash(prevHash) {
    if (prevHash == null) {
        return true;
    }
    return typeof prevHash === "string" && /^[0-9a-f]{64}$/.test(prevHash);
}

function isDelta(row) {
    return (
        row != null &&
        typeof row.content === "string" &&
        isSeq(row.seq) &&
        isPrevHash(row.prev_hash)
    );
}

export async function hashContent(content) {
    if (typeof content !== "string") {
        throw new TypeError("content");
    }
    const digest = await crypto.subtle.digest(
        "SHA-256",
        encoder.encode(content),
    );
    return hex(digest);
}

// seq, then prev_hash (empty if none), then content as the remainder.
export function signingBytes({ seq, prev_hash, content }) {
    if (!isSeq(seq) || !isPrevHash(prev_hash) || typeof content !== "string") {
        throw new TypeError("delta");
    }
    const prev = prev_hash == null ? "" : prev_hash;
    return encoder.encode(`${seq}\n${prev}\n${content}`);
}

export async function assertLink(prev, next) {
    if (!isDelta(next)) {
        return { ok: false, error: "invalid" };
    }
    if (prev == null) {
        if (next.seq !== 1) {
            return { ok: false, error: "seq" };
        }
        if (next.prev_hash != null) {
            return { ok: false, error: "prev_hash" };
        }
        return { ok: true };
    }
    if (!isDelta(prev)) {
        return { ok: false, error: "invalid" };
    }
    if (next.seq !== prev.seq + 1) {
        return { ok: false, error: "seq" };
    }
    const expected = await hashContent(prev.content);
    if (next.prev_hash !== expected) {
        return { ok: false, error: "prev_hash" };
    }
    return { ok: true };
}
