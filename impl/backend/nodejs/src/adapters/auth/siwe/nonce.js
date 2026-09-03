import { generateSiweNonce } from "viem/siwe";

const ttlMs = 10 * 60 * 1000;
const issued = new Map(); // TODO: share before scale-out

export function issueNonce() {
  const nonce = generateSiweNonce();
  issued.set(nonce, Date.now() + ttlMs);
  return nonce;
}

export function nonceIsValid(nonce) {
  const exp = issued.get(nonce);
  return Boolean(exp && exp >= Date.now());
}

export function consumeNonce(nonce) {
  const exp = issued.get(nonce);
  issued.delete(nonce);
  return Boolean(exp && exp >= Date.now());
}
