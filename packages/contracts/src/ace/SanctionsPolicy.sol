// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPolicy} from "./interfaces/IPolicy.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract SanctionsPolicy is IPolicy, Ownable {
    mapping(address => bool) public denyList;

    event AddressDenied(address indexed account);
    event AddressAllowed(address indexed account);

    constructor() Ownable(msg.sender) {}

    function addToDenyList(address account) external onlyOwner {
        denyList[account] = true;
        emit AddressDenied(account);
    }

    function removeFromDenyList(address account) external onlyOwner {
        denyList[account] = false;
        emit AddressAllowed(account);
    }

    function validate(bytes[] memory params) external view override {
        address account = abi.decode(params[0], (address));
        require(!denyList[account], "SanctionsPolicy: address sanctioned");
    }
}
