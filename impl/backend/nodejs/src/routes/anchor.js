import { Hono } from "hono";
import { batchAnchor } from "../adapters/anchor/evm/batch.js";

const anchor = new Hono();

// Invoked periodically by an external scheduler
anchor.post("/run", async (c) => {
    const anchored = await batchAnchor();
    const result = anchored ?? { ok: true, anchored: false };
    console.log(result);
    return c.json(result, result.ok ? 200 : 500);
});

export default anchor;
