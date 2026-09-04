import { randomBytes } from "node:crypto";

const maxAge = 60 * 60 * 24 * 7;

export function createSessionToken() {
    return randomBytes(32).toString("base64url");
}

export function sessionExpiresAt() {
    return new Date(Date.now() + maxAge * 1000);
}
