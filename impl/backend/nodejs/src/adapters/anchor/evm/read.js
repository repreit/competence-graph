import { createPublicClient, http } from "viem";
import { anchor, chain } from "../../../../../../common/js/config.js";
import { anchorAbi } from "./abi.js";

const client = createPublicClient({ chain, transport: http(chain.rpcUrl) });

const windowSize = 8000n;

export async function listAnchored({ blocks = 80000 } = {}) {
    const latest = await client.getBlockNumber();
    const floor = latest > BigInt(blocks) ? latest - BigInt(blocks) : 0n;
    const chunks = [];
    for (let to = latest; to >= floor; ) {
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
    return chunks.reverse().flat().map((log) => ({
        root: log.args.root,
        maxDeltaId: Number(log.args.maxDeltaId),
        blockNumber: Number(log.blockNumber),
        txHash: log.transactionHash,
    }));
}
