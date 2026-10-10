import { Hono } from "hono";
import { batchAnchor } from "../adapters/anchor/evm/batch.js";

const anchor = new Hono();

anchor.post("/run", async (c) => {
    const anchored = await batchAnchor();
    if (!anchored) {
        return c.json({ ok: true, anchored: false });
    }
    return c.json(anchored);
});

export default anchor;
