import { Hono } from "hono";
import { batchAnchor } from "../adapters/anchor/evm/batch.js";
import { listAnchors } from "../adapters/anchor/evm/read.js";

const anchor = new Hono();

// Invoked periodically by an external scheduler
anchor.post("/run", async (c) => {
    const anchored = await batchAnchor();
    if (anchored?.ok === false) {
        console.log(anchored);
        return c.json(anchored, 500);
    }
    const result = {
        ok: true,
        anchor: anchored
            ? {
                  txHash: anchored.txHash,
                  root: anchored.root,
                  maxDeltaId: anchored.maxDeltaId,
              }
            : null,
    };
    console.log(result);
    return c.json(result);
});

anchor.get("/list", async (c) => {
    return c.json({ anchors: await listAnchors() });
});

export default anchor;
