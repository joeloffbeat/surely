// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract EligibilityRegistry is Ownable {
    // user => verificationType => proofHash
    mapping(address => mapping(uint8 => bytes32)) public proofs;

    address public complianceConsumer;

    event ProofStored(address indexed user, uint8 verificationType, bytes32 proofHash);

    constructor() Ownable(msg.sender) {}

    function setComplianceConsumer(address _consumer) external onlyOwner {
        complianceConsumer = _consumer;
    }

    function storeProof(address user, uint8 verificationType, bytes32 proofHash) external {
        require(msg.sender == complianceConsumer || msg.sender == owner(), "EligibilityRegistry: unauthorized");
        proofs[user][verificationType] = proofHash;
        emit ProofStored(user, verificationType, proofHash);
    }

    function getProof(address user, uint8 verificationType) external view returns (bytes32) {
        return proofs[user][verificationType];
    }
}
