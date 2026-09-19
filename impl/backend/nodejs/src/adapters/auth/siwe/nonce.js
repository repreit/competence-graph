import { generateSiweNonce } from "viem/siwe";
import { insertNonce } from "../../db/postgres/tables/nonces.js";

export { consumeNonce, nonceIsValid } from "../../db/postgres/tables/nonces.js";

const ttlMs = 10 * 60 * 1000;

export async function issueNonce() {
    const nonce = generateSiweNonce();
    await insertNonce(nonce, new Date(Date.now() + ttlMs));
    return nonce;
}
