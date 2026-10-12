export const anchorAbi = [
    {
        type: "function",
        name: "anchor",
        stateMutability: "nonpayable",
        inputs: [
            { name: "merkleRoot", type: "bytes32" },
            { name: "maxDeltaId", type: "uint256" },
        ],
        outputs: [],
    },
    {
        type: "event",
        name: "Anchored",
        anonymous: false,
        inputs: [
            { name: "anchorer", type: "address", indexed: true },
            { name: "merkleRoot", type: "bytes32", indexed: true },
            { name: "maxDeltaId", type: "uint256", indexed: true },
        ],
    },
];
