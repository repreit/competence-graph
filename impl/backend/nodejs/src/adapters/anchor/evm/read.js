import { createPublicClient, http } from "viem";
import { chain } from "../../../../../../common/js/config.js";

const client = createPublicClient({ chain, transport: http(chain.rpcUrl) });

console.log(await client.getBlockNumber());
