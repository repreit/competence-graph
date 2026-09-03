import { randomBytes } from "node:crypto";

export const cookieName = "session_token";
const maxAge = 60 * 60 * 24 * 7;

export function createSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function sessionCookieOpts(secure) {
  return {
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    maxAge,
    secure,
  };
}
