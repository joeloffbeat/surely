// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IPolicy {
    function validate(bytes[] memory params) external view;
}
