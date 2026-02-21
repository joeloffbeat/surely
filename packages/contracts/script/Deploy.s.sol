// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {CZUSD} from "../src/CZUSD.sol";
import {PolicyEngine} from "../src/ace/PolicyEngine.sol";
import {UnifiedExtractor} from "../src/ace/UnifiedExtractor.sol";
import {SanctionsPolicy} from "../src/ace/SanctionsPolicy.sol";
import {KYCPolicy} from "../src/ace/KYCPolicy.sol";
import {PremiumVolumePolicy} from "../src/ace/PremiumVolumePolicy.sol";
import {SolvencyPolicy} from "../src/ace/SolvencyPolicy.sol";
import {CoolingOffPolicy} from "../src/ace/CoolingOffPolicy.sol";
import {EligibilityPolicy} from "../src/ace/EligibilityPolicy.sol";
import {CZUSDConsumer} from "../src/CZUSDConsumer.sol";
import {PolicyNFT} from "../src/PolicyNFT.sol";
import {EligibilityRegistry} from "../src/EligibilityRegistry.sol";
import {ComplianceConsumer} from "../src/ComplianceConsumer.sol";
import {CRERouter} from "../src/CRERouter.sol";
import {SurelyFactory} from "../src/SurelyFactory.sol";
import {InsurancePool} from "../src/InsurancePool.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // 1. CZUSD
        CZUSD czusd = new CZUSD();
        console.log("CZUSD:", address(czusd));

        // 2. ACE stack
        PolicyEngine policyEngine = new PolicyEngine();
        console.log("PolicyEngine:", address(policyEngine));

        UnifiedExtractor extractor = new UnifiedExtractor();
        console.log("UnifiedExtractor:", address(extractor));

        SanctionsPolicy sanctionsPolicy = new SanctionsPolicy();
        console.log("SanctionsPolicy:", address(sanctionsPolicy));

        KYCPolicy kycPolicy = new KYCPolicy();
        console.log("KYCPolicy:", address(kycPolicy));

        // min 1 CZUSD, max 1M CZUSD (6 decimals)
        PremiumVolumePolicy volumePolicy = new PremiumVolumePolicy(1e6, 1_000_000e6);
        console.log("PremiumVolumePolicy:", address(volumePolicy));

        // 120% = 12000 bps
        SolvencyPolicy solvencyPolicy = new SolvencyPolicy(12000);
        console.log("SolvencyPolicy:", address(solvencyPolicy));

        // 14 days cooling off
        CoolingOffPolicy coolingOffPolicy = new CoolingOffPolicy(14 days);
        console.log("CoolingOffPolicy:", address(coolingOffPolicy));

        // 3. EligibilityRegistry (needed for EligibilityPolicy)
        EligibilityRegistry eligibilityRegistry = new EligibilityRegistry();
        console.log("EligibilityRegistry:", address(eligibilityRegistry));

        EligibilityPolicy eligibilityPolicy = new EligibilityPolicy(address(eligibilityRegistry));
        console.log("EligibilityPolicy:", address(eligibilityPolicy));

        // 4. CZUSDConsumer
        CZUSDConsumer czusdConsumer = new CZUSDConsumer(address(czusd), address(policyEngine));
        console.log("CZUSDConsumer:", address(czusdConsumer));

        // 5. PolicyNFT
        PolicyNFT policyNFT = new PolicyNFT();
        console.log("PolicyNFT:", address(policyNFT));

        // 6. ComplianceConsumer
        ComplianceConsumer complianceConsumer = new ComplianceConsumer(
            address(eligibilityRegistry),
            address(sanctionsPolicy),
            address(kycPolicy)
        );
        console.log("ComplianceConsumer:", address(complianceConsumer));

        // 7. CRERouter
        CRERouter creRouter = new CRERouter();
        console.log("CRERouter:", address(creRouter));

        // 8. SurelyFactory
        SurelyFactory factory = new SurelyFactory(
            address(czusd),
            address(policyNFT),
            address(policyEngine),
            address(creRouter),
            address(eligibilityRegistry)
        );
        console.log("SurelyFactory:", address(factory));

        // --- Configuration ---

        // 9. CZUSD -> set consumer
        czusd.setConsumer(address(czusdConsumer));

        // 10. CRERouter -> set factory
        creRouter.setFactory(address(factory));

        // 11. EligibilityRegistry -> set compliance consumer
        eligibilityRegistry.setComplianceConsumer(address(complianceConsumer));

        // 12. PolicyEngine -> set extractor for both onReport selectors
        bytes4 onReportSelector = bytes4(keccak256("onReport(bytes)"));
        policyEngine.setExtractor(onReportSelector, address(extractor));

        // 13. PolicyEngine -> attach policies for CZUSDConsumer (SanctionsPolicy + VolumePolicy)
        // Note: CZUSDConsumer and InsurancePool share the same onReport(bytes) selector
        // The UnifiedExtractor differentiates by the workflowType field
        policyEngine.attachPolicy(onReportSelector, address(sanctionsPolicy));
        policyEngine.attachPolicy(onReportSelector, address(volumePolicy));

        // Transfer ownership of SanctionsPolicy + KYCPolicy to ComplianceConsumer
        // so CRE workflows can update them
        sanctionsPolicy.transferOwnership(address(complianceConsumer));
        kycPolicy.transferOwnership(address(complianceConsumer));

        // Transfer PolicyNFT ownership to factory for pool authorization
        policyNFT.transferOwnership(address(factory));

        vm.stopBroadcast();

        console.log("\n--- Deployment Complete ---");
    }
}
