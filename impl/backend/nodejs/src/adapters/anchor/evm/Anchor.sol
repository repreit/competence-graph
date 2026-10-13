// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Anchor {
    event Anchored(
        address indexed anchorer,
        bytes32 indexed merkleRoot,
        uint256 indexed maxDeltaId
    );

    function anchor(bytes32 merkleRoot, uint256 maxDeltaId) external {
        emit Anchored(msg.sender, merkleRoot, maxDeltaId);
    }
}
