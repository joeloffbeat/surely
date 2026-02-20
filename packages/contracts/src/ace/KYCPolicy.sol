// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPolicy} from "./interfaces/IPolicy.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract KYCPolicy is IPolicy, Ownable {
    mapping(address => bool) public credentials;

    event CredentialSet(address indexed account, bool status);

    constructor() Ownable(msg.sender) {}

    function setCredential(address account) external onlyOwner {
        credentials[account] = true;
        emit CredentialSet(account, true);
    }

    function revokeCredential(address account) external onlyOwner {
        credentials[account] = false;
        emit CredentialSet(account, false);
    }

    function hasCredential(address account) external view returns (bool) {
        return credentials[account];
    }

    function validate(bytes[] memory params) external view override {
        address account = abi.decode(params[0], (address));
        require(credentials[account], "KYCPolicy: no KYC credential");
    }
}
