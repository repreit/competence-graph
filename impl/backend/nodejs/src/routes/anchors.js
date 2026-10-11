import { Hono } from "hono";
import { batchAnchor } from "../adapters/anchor/evm/batch.js";
import { listAnchors } from "../adapters/anchor/evm/read.js";

const anchors = new Hono();

// Invoked periodically by an external scheduler
anchors.post("/run", async (c) => {
    const anchored = await batchAnchor();
    if (anchored && !anchored.ok) {
        console.log(anchored);
        return c.json(anchored, 500);
    }
    const result = {
        ok: true,
        anchor: anchored
            ? {
                  txHash: anchored.txHash,
                  merkleRoot: anchored.merkleRoot,
                  maxDeltaId: anchored.maxDeltaId,
              }
            : null,
    };
    console.log(result);
    return c.json(result);
});

// TODO: Review cache
anchors.get("/list", async (c) => {
    c.header("Cache-Control", "public, max-age=120");
    return c.json({ anchors: await listAnchors() });
});

export default anchors;
