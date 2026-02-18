// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IPolicyEngine} from "./ace/interfaces/IPolicyEngine.sol";

interface ICZUSD {
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
}

contract CZUSDConsumer is Ownable {
    enum WorkflowType { MINT_CRYPTO, MINT_CCIP, MINT_FIAT, BURN, SETTLEMENT }

    ICZUSD public czusd;
    IPolicyEngine public policyEngine;

    event ReportProcessed(uint8 workflowType, address recipient, uint256 amount, bytes32 proofHash);

    modifier runPolicy() {
        policyEngine.run(msg.data);
        _;
    }

    constructor(address _czusd, address _policyEngine) Ownable(msg.sender) {
        czusd = ICZUSD(_czusd);
        policyEngine = IPolicyEngine(_policyEngine);
    }

    function onReport(bytes calldata report) external runPolicy {
        (uint8 workflowType, address recipient, uint256 amount, bytes32 proofHash) =
            abi.decode(report, (uint8, address, uint256, bytes32));

        if (workflowType == uint8(WorkflowType.BURN)) {
            czusd.burn(recipient, amount);
        } else if (workflowType == uint8(WorkflowType.SETTLEMENT)) {
            czusd.mint(recipient, amount);
        } else {
            // MINT_CRYPTO, MINT_CCIP, MINT_FIAT
            czusd.mint(recipient, amount);
        }

        emit ReportProcessed(workflowType, recipient, amount, proofHash);
    }
}
