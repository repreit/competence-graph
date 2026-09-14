import { Hono } from "hono";
import { cors } from "hono/cors";
import {
    setSession,
    clearSessionToken,
    findBySessionToken,
} from "./adapters/db/postgres/sessions.js";
import { issueNonce } from "./adapters/auth/siwe/nonce.js";
import {
    createSessionToken,
    sessionExpiresAt,
} from "./adapters/auth/siwe/session.js";
import { verifySignedMessage } from "./adapters/auth/siwe/verify.js";
import {
    verifyBindAttestation,
    verifyUnbindAttestation,
} from "./adapters/auth/attestation/verify.js";
import { bindContent, unbindContent } from "../../../common/js/attest.js";
import {
    bindKey,
    findActiveBinding,
    listBindings,
    unbindKey,
} from "./adapters/db/postgres/bindings.js";

const app = new Hono();

app.use(
    "*",
    cors({
        origin: "*",
        allowHeaders: ["Authorization", "Content-Type"],
        allowMethods: ["GET", "POST", "OPTIONS"],
    }),
);

function publicAccount(row) {
    return { id: row.id, address: row.address };
}

function bearerToken(c) {
    const header = c.req.header("authorization");
    if (!header) {
        return null;
    }
    const match = /^Bearer\s+(.+)$/i.exec(header.trim());
    if (!match) {
        return null;
    }
    const token = match[1].trim();
    return token.length > 0 ? token : null;
}

async function readJson(c) {
    const text = await c.req.text();
    if (text.length > 65536) {
        throw new Error("too_large");
    }
    if (text.length === 0) {
        return {};
    }
    return JSON.parse(text);
}

app.get("/auth/nonce", async (c) => c.json({ nonce: await issueNonce() }));

app.post("/auth/verify", async (c) => {
    let body;
    try {
        body = await readJson(c);
    } catch {
        return c.json({ error: "invalid_json" }, 400);
    }
    const message = body.message;
    const signature = body.signature;
    if (typeof message !== "string" || typeof signature !== "string") {
        return c.json({ error: "invalid_json" }, 400);
    }
    const result = await verifySignedMessage({ message, signature });
    if (!result.ok) {
        return c.json({ error: result.error }, 401);
    }
    const token = createSessionToken();
    const row = await setSession(result.address, token, sessionExpiresAt());
    return c.json({ ...publicAccount(row), token });
});

app.get("/auth/me", async (c) => {
    const row = await findBySessionToken(bearerToken(c));
    if (!row) {
        return c.json({ error: "unauthorized" }, 401);
    }
    return c.json(publicAccount(row));
});

app.post("/auth/logout", async (c) => {
    await clearSessionToken(bearerToken(c));
    return c.json({ ok: true });
});

app.get("/bindings", async (c) => {
    const account = await findBySessionToken(bearerToken(c));
    if (!account) {
        return c.json({ error: "unauthorized" }, 401);
    }
    return c.json({ bindings: await listBindings(account.id) });
});

app.post("/bindings/bind", async (c) => {
    const account = await findBySessionToken(bearerToken(c));
    if (!account) {
        return c.json({ error: "unauthorized" }, 401);
    }
    let body;
    try {
        body = await readJson(c);
    } catch {
        return c.json({ error: "invalid_json" }, 400);
    }
    const publicKey = body.publicKey;
    const signature = body.signature;
    if (publicKey == null || typeof signature !== "string") {
        return c.json({ error: "invalid_json" }, 400);
    }
    const attestation = await verifyBindAttestation({
        address: account.address,
        publicKey,
        signature,
    });
    if (!attestation.ok) {
        return c.json({ error: attestation.error }, 401);
    }
    const content = bindContent(publicKey);
    const result = await bindKey(account.id, {
        content,
        signature,
    });
    if (!result.ok) {
        return c.json({ error: result.error }, result.error === "invalid" ? 400 : 409);
    }
    return c.json({ ok: true, seq: result.seq });
});

app.post("/bindings/:id/unbind", async (c) => {
    const account = await findBySessionToken(bearerToken(c));
    if (!account) {
        return c.json({ error: "unauthorized" }, 401);
    }
    const id = Number(c.req.param("id"));
    if (!Number.isSafeInteger(id) || id < 1) {
        return c.json({ error: "invalid_json" }, 400);
    }
    let body;
    try {
        body = await readJson(c);
    } catch {
        return c.json({ error: "invalid_json" }, 400);
    }
    const signature = body.signature;
    if (typeof signature !== "string") {
        return c.json({ error: "invalid_json" }, 400);
    }
    const binding = await findActiveBinding(account.id, id);
    if (!binding) {
        return c.json({ error: "not_found" }, 404);
    }
    const publicKey = JSON.parse(binding.public_key);
    const attestation = await verifyUnbindAttestation({
        address: account.address,
        bindingId: id,
        publicKey,
        signature,
    });
    if (!attestation.ok) {
        return c.json({ error: attestation.error }, 401);
    }
    const content = unbindContent(id, publicKey);
    const result = await unbindKey(account.id, id, { content, signature });
    if (!result.ok) {
        return c.json(
            { error: result.error },
            result.error === "not_found" ? 404 : 409,
        );
    }
    return c.json({ ok: true, seq: result.seq });
});

app.notFound((c) => c.json({ error: "not_found" }, 404));

app.onError((err, c) => {
    console.error(err);
    return c.json({ error: "internal" }, 500);
});

export default app;
