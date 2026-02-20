// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IExtractor {
    function extract(bytes calldata callData) external pure returns (bytes[] memory);
}
