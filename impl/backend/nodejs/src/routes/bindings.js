import { Hono } from "hono";
import {
    verifyBindAttestation,
    verifyUnbindAttestation,
} from "../adapters/auth/attestation/verify.js";
import { bindContent, unbindContent } from "../../../../common/js/attest.js";
import {
    bindKey,
    findActiveBinding,
    listBindings,
    unbindKey,
} from "../adapters/db/postgres/bindings.js";
import { requireJson } from "../middleware/json.js";
import { requireSession } from "../middleware/session.js";

const bindings = new Hono();

bindings.get("/", requireSession, async (c) => {
    return c.json({ bindings: await listBindings(c.get("account").id) });
});

bindings.post("/bind", requireSession, requireJson, async (c) => {
    const account = c.get("account");
    const body = c.get("body");
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
        return c.json(
            { error: result.error },
            result.error === "invalid" ? 400 : 409,
        );
    }
    return c.json({ ok: true, seq: result.seq });
});

bindings.post("/:id/unbind", requireSession, requireJson, async (c) => {
    const account = c.get("account");
    const id = Number(c.req.param("id"));
    if (!Number.isSafeInteger(id) || id < 1) {
        return c.json({ error: "invalid_json" }, 400);
    }
    const body = c.get("body");
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

export default bindings;
