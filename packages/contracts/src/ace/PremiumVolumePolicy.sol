// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPolicy} from "./interfaces/IPolicy.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract PremiumVolumePolicy is IPolicy, Ownable {
    uint256 public minAmount;
    uint256 public maxAmount;

    event LimitsUpdated(uint256 minAmount, uint256 maxAmount);

    constructor(uint256 _minAmount, uint256 _maxAmount) Ownable(msg.sender) {
        minAmount = _minAmount;
        maxAmount = _maxAmount;
    }

    function setLimits(uint256 _minAmount, uint256 _maxAmount) external onlyOwner {
        require(_minAmount <= _maxAmount, "PremiumVolumePolicy: invalid range");
        minAmount = _minAmount;
        maxAmount = _maxAmount;
        emit LimitsUpdated(_minAmount, _maxAmount);
    }

    function validate(bytes[] memory params) external view override {
        uint256 amount = abi.decode(params[1], (uint256));
        require(amount >= minAmount, "PremiumVolumePolicy: below minimum");
        require(amount <= maxAmount, "PremiumVolumePolicy: above maximum");
    }
}
