// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {PolicyNFT} from "./PolicyNFT.sol";

contract InsurancePool is Ownable {
    IERC20 public stablecoin;
    PolicyNFT public policyNFT;

    string public name;
    string public description;
    uint256 public premiumAmount;
    uint256 public payoutMultiplier;
    uint256 public totalDeposited;

    bool public isActive;

    mapping(uint256 => address) public policyHolders;

    constructor(
        string memory _name,
        string memory _description,
        address _stablecoin,
        address _policyNFT,
        uint256 _premiumAmount,
        uint256 _payoutMultiplier
    ) Ownable(msg.sender) {
        name = _name;
        description = _description;
        stablecoin = IERC20(_stablecoin);
        policyNFT = PolicyNFT(_policyNFT);
        premiumAmount = _premiumAmount;
        payoutMultiplier = _payoutMultiplier;
    }

    function deposit(uint256 amount) external {
        stablecoin.transferFrom(msg.sender, address(this), amount);
        totalDeposited += amount;
    }

    function activate() external onlyOwner {
        isActive = true;
    }
}
