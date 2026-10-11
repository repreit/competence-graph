import { isHash } from "viem";
import { isPositiveSafeInt } from "../../../../../../common/js/a001.js";

export async function anchorRoot({
    client,
    address,
    abi,
    merkleRoot,
    maxDeltaId,
}) {
    if (!client || !address || !Array.isArray(abi)) {
        return { ok: false, error: "invalid_request" };
    }
    if (!isHash(merkleRoot)) {
        return { ok: false, error: "invalid_root" };
    }
    if (!isPositiveSafeInt(maxDeltaId)) {
        return { ok: false, error: "invalid_max_delta_id" };
    }

    let txHash;
    try {
        txHash = await client.writeContract({
            address,
            abi,
            functionName: "anchor",
            args: [merkleRoot, maxDeltaId],
        });
    } catch {
        return { ok: false, error: "send" };
    }

    let receipt;
    try {
        receipt = await client.waitForTransactionReceipt({
            hash: txHash,
        });
    } catch {
        return { ok: false, error: "receipt", txHash };
    }

    if (receipt.status !== "success") {
        return { ok: false, error: "reverted", txHash };
    }

    return { ok: true, txHash };
}
