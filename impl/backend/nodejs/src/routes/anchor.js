import { Hono } from "hono";
import { batchAnchor } from "../adapters/anchor/evm/batch.js";

const anchor = new Hono();

anchor.post("/run", async (c) => {
    const anchored = await batchAnchor();
    const result = anchored ?? { ok: true, anchored: false };
    console.log(result);
    return c.json(result);
});

export default anchor;
