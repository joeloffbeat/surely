// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface IInsurancePoolReceiver {
    function onReport(bytes calldata report) external;
}

contract CRERouter is Ownable {
    mapping(address => bool) public validPools;
    address public factory;

    event PoolRegistered(address indexed pool);
    event ReportRouted(address indexed pool);

    constructor() Ownable(msg.sender) {}

    function setFactory(address _factory) external onlyOwner {
        factory = _factory;
    }

    function registerPool(address pool) external {
        require(msg.sender == factory || msg.sender == owner(), "CRERouter: unauthorized");
        validPools[pool] = true;
        emit PoolRegistered(pool);
    }

    function onReport(bytes calldata report) external {
        // First 20 bytes of report = pool address, rest = pool report data
        (address poolAddress, bytes memory poolReport) = abi.decode(report, (address, bytes));
        require(validPools[poolAddress], "CRERouter: invalid pool");

        IInsurancePoolReceiver(poolAddress).onReport(poolReport);
        emit ReportRouted(poolAddress);
    }
}
