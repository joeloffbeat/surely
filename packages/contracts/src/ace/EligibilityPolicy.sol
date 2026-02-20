// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPolicy} from "./interfaces/IPolicy.sol";

interface IEligibilityRegistry {
    function getProof(address user, uint8 verificationType) external view returns (bytes32);
}

contract EligibilityPolicy is IPolicy {
    IEligibilityRegistry public immutable registry;

    constructor(address _registry) {
        registry = IEligibilityRegistry(_registry);
    }

    function validate(bytes[] memory params) external view override {
        address buyer = abi.decode(params[0], (address));
        uint8 verificationType = abi.decode(params[1], (uint8));
        // verificationType 0 = none, skip check
        if (verificationType == 0) return;
        require(
            registry.getProof(buyer, verificationType) != bytes32(0),
            "EligibilityPolicy: no eligibility proof"
        );
    }
}
