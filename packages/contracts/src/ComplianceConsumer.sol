// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface IEligibilityRegistryWriter {
    function storeProof(address user, uint8 verificationType, bytes32 proofHash) external;
}

interface ISanctionsPolicyWriter {
    function addToDenyList(address account) external;
}

interface IKYCPolicyWriter {
    function setCredential(address account) external;
}

contract ComplianceConsumer is Ownable {
    enum ComplianceAction { STORE_ELIGIBILITY, ADD_SANCTIONS, SET_KYC }

    IEligibilityRegistryWriter public eligibilityRegistry;
    ISanctionsPolicyWriter public sanctionsPolicy;
    IKYCPolicyWriter public kycPolicy;

    event ComplianceReportProcessed(uint8 action, address target);

    constructor(
        address _eligibilityRegistry,
        address _sanctionsPolicy,
        address _kycPolicy
    ) Ownable(msg.sender) {
        eligibilityRegistry = IEligibilityRegistryWriter(_eligibilityRegistry);
        sanctionsPolicy = ISanctionsPolicyWriter(_sanctionsPolicy);
        kycPolicy = IKYCPolicyWriter(_kycPolicy);
    }

    function onReport(bytes calldata report) external {
        (uint8 action, address target, uint8 verificationType, bytes32 proofHash) =
            abi.decode(report, (uint8, address, uint8, bytes32));

        if (action == uint8(ComplianceAction.STORE_ELIGIBILITY)) {
            eligibilityRegistry.storeProof(target, verificationType, proofHash);
        } else if (action == uint8(ComplianceAction.ADD_SANCTIONS)) {
            sanctionsPolicy.addToDenyList(target);
        } else if (action == uint8(ComplianceAction.SET_KYC)) {
            kycPolicy.setCredential(target);
        }

        emit ComplianceReportProcessed(action, target);
    }
}
