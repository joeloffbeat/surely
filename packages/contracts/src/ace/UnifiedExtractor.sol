// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IExtractor} from "./interfaces/IExtractor.sol";

contract UnifiedExtractor is IExtractor {
    // Selector for CZUSDConsumer.onReport(bytes)
    bytes4 public constant CZUSD_CONSUMER_SELECTOR = bytes4(keccak256("onReport(bytes)"));

    function extract(bytes calldata callData) external pure override returns (bytes[] memory) {
        // Skip the 4-byte selector to get the arguments
        // onReport(bytes) -> abi.decode the bytes parameter
        bytes memory reportData = abi.decode(callData[4:], (bytes));

        // First byte determines the workflow type
        uint8 workflowType = abi.decode(reportData, (uint8));

        // Check which contract is calling based on the decoded fields
        // CZUSDConsumer reports: (uint8 workflowType, address recipient, uint256 amount, bytes32 proofHash)
        // InsurancePool reports: (uint8 action, int256 value, uint8 consecutiveCount, uint256 confidence)

        // We differentiate by the number and types of decoded fields
        // For CZUSDConsumer (workflowType 0-4): extract recipient and amount
        if (workflowType <= 4) {
            // CZUSDConsumer path
            (, address recipient, uint256 amount, ) = abi.decode(
                reportData, (uint8, address, uint256, bytes32)
            );

            bytes[] memory params = new bytes[](3);
            params[0] = abi.encode(recipient);    // For SanctionsPolicy
            params[1] = abi.encode(amount);       // For VolumePolicy
            params[2] = abi.encode(workflowType); // For routing
            return params;
        } else {
            // InsurancePool path (action types 10+)
            (, int256 value, uint8 consecutiveCount, uint256 confidence) = abi.decode(
                reportData, (uint8, int256, uint8, uint256)
            );

            bytes[] memory params = new bytes[](4);
            params[0] = abi.encode(workflowType);
            params[1] = abi.encode(value);
            params[2] = abi.encode(consecutiveCount);
            params[3] = abi.encode(confidence);
            return params;
        }
    }
}
