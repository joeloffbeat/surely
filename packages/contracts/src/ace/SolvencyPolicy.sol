// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPolicy} from "./interfaces/IPolicy.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract SolvencyPolicy is IPolicy, Ownable {
    uint256 public minRatioBps; // basis points, default 12000 = 120%

    event MinRatioUpdated(uint256 minRatioBps);

    constructor(uint256 _minRatioBps) Ownable(msg.sender) {
        minRatioBps = _minRatioBps;
    }

    function setMinRatio(uint256 _minRatioBps) external onlyOwner {
        minRatioBps = _minRatioBps;
        emit MinRatioUpdated(_minRatioBps);
    }

    function validate(bytes[] memory params) external view override {
        // params[0] = reserves, params[1] = liabilities
        uint256 reserves = abi.decode(params[0], (uint256));
        uint256 liabilities = abi.decode(params[1], (uint256));
        if (liabilities == 0) return; // no liabilities = solvent
        require(
            (reserves * 10000) / liabilities >= minRatioBps,
            "SolvencyPolicy: undercollateralized"
        );
    }
}
