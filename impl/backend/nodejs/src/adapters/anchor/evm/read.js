import { createPublicClient, http } from "viem";
import { anchor, chain } from "../../../../../../common/js/config.js";
import { anchorAbi } from "./abi.js";

const client = createPublicClient({ chain, transport: http(chain.rpcUrl) });

const WINDOW_SIZE = 8000n;

export async function listAnchors({ blocks = 80000 } = {}) {
    const latest = await client.getBlockNumber();
    const floor = latest > BigInt(blocks) ? latest - BigInt(blocks) : 0n;
    const chunks = [];
    for (let to = latest; to >= floor;) {
        const from = to - WINDOW_SIZE >= floor ? to - WINDOW_SIZE : floor;
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
    return logs.map((log) => ({
        root: log.args.root,
        maxDeltaId: Number(log.args.maxDeltaId),
        blockNumber: Number(log.blockNumber),
        txHash: log.transactionHash,
        timestamp: new Date(Number(log.blockTimestamp) * 1000).toISOString(),
    }));
}
