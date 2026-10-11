import { createPublicClient, http } from "viem";
import { anchor, chain } from "../../../../../../common/js/config.js";
import { anchorAbi } from "./abi.js";

const client = createPublicClient({ chain, transport: http(chain.rpcUrl) });

const windowSize = 8000n;

export async function listAnchors({ blocks = 80000 } = {}) {
    const latest = await client.getBlockNumber();
    const floor = latest > BigInt(blocks) ? latest - BigInt(blocks) : 0n;
    const chunks = [];
    for (let to = latest; to >= floor;) {
        const from = to - windowSize >= floor ? to - windowSize : floor;
        chunks.push(
            await client.getContractEvents({
                address: anchor.address,
                abi: anchorAbi,
                eventName: "Anchored",
                fromBlock: from,
                toBlock: to,
            }),
        );
        if (from === floor) {
            break;
        }
        to = from - 1n;
    }
    const logs = chunks.reverse().flat();
    const timestamps = new Map();
    await Promise.all(
        [...new Set(logs.map((log) => log.blockNumber))].map(
            async (blockNumber) => {
                const block = await client.getBlock({ blockNumber });
                timestamps.set(blockNumber, block.timestamp);
            },
        ),
    );
    return logs.map((log) => ({
        root: log.args.root,
        maxDeltaId: Number(log.args.maxDeltaId),
        blockNumber: Number(log.blockNumber),
        txHash: log.transactionHash,
        timestamp: new Date(
            Number(timestamps.get(log.blockNumber)) * 1000,
        ).toISOString(),
    }));
}
