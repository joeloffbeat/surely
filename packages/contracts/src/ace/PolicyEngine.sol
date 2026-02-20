// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPolicy} from "./interfaces/IPolicy.sol";
import {IExtractor} from "./interfaces/IExtractor.sol";
import {IPolicyEngine} from "./interfaces/IPolicyEngine.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract PolicyEngine is IPolicyEngine, Ownable {
    mapping(bytes4 => address) public extractors;
    mapping(bytes4 => address[]) public policies;

    event ExtractorSet(bytes4 indexed selector, address extractor);
    event PolicyAttached(bytes4 indexed selector, address policy);

    constructor() Ownable(msg.sender) {}

    function setExtractor(bytes4 selector, address extractor) external onlyOwner {
        extractors[selector] = extractor;
        emit ExtractorSet(selector, extractor);
    }

    function attachPolicy(bytes4 selector, address policy) external onlyOwner {
        policies[selector].push(policy);
        emit PolicyAttached(selector, policy);
    }

    function run(bytes calldata callData) external override {
        bytes4 selector = bytes4(callData[:4]);
        address extractor = extractors[selector];
        require(extractor != address(0), "PolicyEngine: no extractor");

        bytes[] memory params = IExtractor(extractor).extract(callData);

        address[] memory policyList = policies[selector];
        for (uint256 i = 0; i < policyList.length; i++) {
            IPolicy(policyList[i]).validate(params);
        }
    }

    function getPolicies(bytes4 selector) external view returns (address[] memory) {
        return policies[selector];
    }
}
