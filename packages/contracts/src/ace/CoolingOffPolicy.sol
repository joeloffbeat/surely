// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPolicy} from "./interfaces/IPolicy.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract CoolingOffPolicy is IPolicy, Ownable {
    uint256 public coolingPeriod; // seconds, default 14 days

    event CoolingPeriodUpdated(uint256 period);

    constructor(uint256 _coolingPeriod) Ownable(msg.sender) {
        coolingPeriod = _coolingPeriod;
    }

    function setCoolingPeriod(uint256 _period) external onlyOwner {
        coolingPeriod = _period;
        emit CoolingPeriodUpdated(_period);
    }

    function validate(bytes[] memory params) external view override {
        // params[0] = previous purchaseTimestamp (0 = no previous purchase)
        uint256 purchaseTimestamp = abi.decode(params[0], (uint256));
        // If no previous purchase, always allow
        if (purchaseTimestamp == 0) return;
        // Must wait until cooling-off period has fully elapsed before re-purchasing
        require(
            block.timestamp >= purchaseTimestamp + coolingPeriod,
            "CoolingOffPolicy: cooling-off period not yet elapsed"
        );
    }
}
