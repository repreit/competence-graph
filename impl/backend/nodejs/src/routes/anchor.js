import { Hono } from "hono";
import { batchAnchor } from "../adapters/anchor/evm/batch.js";
import { listAnchored } from "../adapters/anchor/evm/read.js";

const anchor = new Hono();

// Invoked periodically by an external scheduler
anchor.post("/run", async (c) => {
    const anchored = await batchAnchor();
    const result = anchored ?? { ok: true, anchored: false };
    console.log(result);
    return c.json(result, result.ok ? 200 : 500);
});

anchor.get("/list", async (c) => {
    return c.json({ anchored: await listAnchored() });
});

export default anchor;
