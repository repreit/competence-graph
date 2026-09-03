import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import {
    setSession,
    clearSessionToken,
    findBySessionToken,
} from "./adapters/db/postgres/accounts.js";
import { issueNonce } from "./adapters/auth/siwe/nonce.js";
import {
    cookieName,
    createSessionToken,
    sessionCookieOpts,
    sessionExpiresAt,
} from "./adapters/auth/siwe/session.js";
import { verifySignedMessage } from "./adapters/auth/siwe/verify.js";

const app = new Hono();

function isHttps(c) {
    const url = new URL(c.req.url);
    if (url.protocol === "https:") {
        return true;
    }
    return c.req.header("x-forwarded-proto") === "https";
}

function publicAccount(row) {
    return { id: row.id, address: row.address };
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
    const domain = c.req.header("host");
    if (!domain) {
        return c.json({ error: "host" }, 400);
    }
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
    const result = await verifySignedMessage({
        message,
        signature,
        domain,
    });
    if (!result.ok) {
        return c.json({ error: result.error }, 401);
    }
    const token = createSessionToken();
    const row = await setSession(result.address, token, sessionExpiresAt());
    setCookie(c, cookieName, token, sessionCookieOpts(isHttps(c)));
    return c.json(publicAccount(row));
});

app.get("/auth/me", async (c) => {
    const row = await findBySessionToken(getCookie(c, cookieName));
    if (!row) {
        return c.json({ error: "unauthorized" }, 401);
    }
    return c.json(publicAccount(row));
});

app.post("/auth/logout", async (c) => {
    const token = getCookie(c, cookieName);
    await clearSessionToken(token);
    deleteCookie(c, cookieName, sessionCookieOpts(isHttps(c)));
    return c.json({ ok: true });
});

app.notFound((c) => c.json({ error: "not_found" }, 404));

app.onError((err, c) => {
    console.error(err);
    return c.json({ error: "internal" }, 500);
});

export default app;
