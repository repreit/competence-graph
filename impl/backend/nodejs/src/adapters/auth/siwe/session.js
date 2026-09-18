import { createHash, randomBytes } from "node:crypto";

const maxAge = 60 * 60 * 24 * 7;

export function createSessionToken() {
    return randomBytes(32).toString("base64url");
}

export function hashSessionToken(sessionToken) {
    return createHash("sha256").update(sessionToken, "utf8").digest("hex");
}

export function sessionExpiresAt() {
    return new Date(Date.now() + maxAge * 1000);
}
