// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
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

// ─────────────────────────────────────────────────────────────────────────────
// Shared fixture — deployed once, reused across all test contracts
// ─────────────────────────────────────────────────────────────────────────────
contract SurelyFixture is Test {
    CZUSD czusd;
    PolicyEngine policyEngine;
    UnifiedExtractor extractor;
    SanctionsPolicy sanctionsPolicy;
    KYCPolicy kycPolicy;
    PremiumVolumePolicy volumePolicy;
    SolvencyPolicy solvencyPolicy;
    CoolingOffPolicy coolingOffPolicy;
    EligibilityRegistry eligibilityRegistry;
    EligibilityPolicy eligibilityPolicy;
    CZUSDConsumer czusdConsumer;
    PolicyNFT policyNFT;
    ComplianceConsumer complianceConsumer;
    CRERouter creRouter;
    SurelyFactory factory;

    address deployer = address(this);
    address underwriter = makeAddr("underwriter");
    address alice = makeAddr("alice");       // clean buyer
    address bob = makeAddr("bob");           // second buyer
    address charlie = makeAddr("charlie");  // third buyer
    address sanctioned = makeAddr("sanctioned");
    address eve = makeAddr("eve");           // bad actor

    bytes4 constant ON_REPORT_SEL = bytes4(keccak256("onReport(bytes)"));

    function _deploy() internal {
        czusd = new CZUSD();
        policyEngine = new PolicyEngine();
        extractor = new UnifiedExtractor();
        sanctionsPolicy = new SanctionsPolicy();
        kycPolicy = new KYCPolicy();
        // Min premium 1 CZUSD (1e6), max 1M CZUSD
        volumePolicy = new PremiumVolumePolicy(1e6, 1_000_000e6);
        // 120% collateral ratio
        solvencyPolicy = new SolvencyPolicy(12000);
        // 14-day cooling-off period
        coolingOffPolicy = new CoolingOffPolicy(14 days);
        eligibilityRegistry = new EligibilityRegistry();
        eligibilityPolicy = new EligibilityPolicy(address(eligibilityRegistry));
        czusdConsumer = new CZUSDConsumer(address(czusd), address(policyEngine));
        policyNFT = new PolicyNFT();
        complianceConsumer = new ComplianceConsumer(
            address(eligibilityRegistry),
            address(sanctionsPolicy),
            address(kycPolicy)
        );
        creRouter = new CRERouter();
        factory = new SurelyFactory(
            address(czusd),
            address(policyNFT),
            address(policyEngine),
            address(creRouter),
            address(eligibilityRegistry)
        );

        // Wire everything up
        czusd.setConsumer(address(czusdConsumer));
        creRouter.setFactory(address(factory));
        eligibilityRegistry.setComplianceConsumer(address(complianceConsumer));
        policyNFT.transferOwnership(address(factory));

        // Configure ACE for CZUSDConsumer.onReport:
        // UnifiedExtractor decodes (recipient, amount, workflowType) from report bytes
        policyEngine.setExtractor(ON_REPORT_SEL, address(extractor));
        policyEngine.attachPolicy(ON_REPORT_SEL, address(sanctionsPolicy));
        policyEngine.attachPolicy(ON_REPORT_SEL, address(volumePolicy));
    }

    // Mint CZUSD directly (bypasses ACE — for test setup only)
    function _mintCZUSD(address to, uint256 amount) internal {
        czusd.ownerMint(to, amount);
    }

    function _buildPoolConfig(
        string memory poolName,
        uint8 comparison,
        int256 threshold,
        uint8 verificationType,
        uint256 premiumAmount,
        uint256 maxPayout,
        uint256 durationDays
    ) internal view returns (InsurancePool.PoolConfig memory) {
        return InsurancePool.PoolConfig({
            name: poolName,
            description: "Parametric insurance pool",
            comparison: comparison,
            triggerThreshold: threshold,
            duration: 1,
            consensusMethod: 0, // byMedian
            verificationCadence: 600,
            eligibilityAgreementHash: keccak256(bytes(string.concat(poolName, "-eligibility"))),
            settlementAgreementHash: keccak256(bytes(string.concat(poolName, "-settlement"))),
            eligibilityTldrHash: keccak256(bytes(string.concat(poolName, "-eligibility-tldr"))),
            settlementTldrHash: keccak256(bytes(string.concat(poolName, "-settlement-tldr"))),
            verificationType: verificationType,
            premiumAmount: premiumAmount,
            maxPayoutPerPolicy: maxPayout,
            poolEndTimestamp: block.timestamp + durationDays * 1 days,
            minPolicyholders: 1,
            maxPolicyholders: 100
        });
    }

    function _createAndActivatePool(InsurancePool.PoolConfig memory config) internal returns (address) {
        address pool = factory.createPool(config);
        factory.activatePool(pool);
        return pool;
    }

    function _routeSettlement(address pool, uint256 confidence) internal {
        bytes memory poolReport = abi.encode(
            uint8(1), // SETTLEMENT
            int256(-25),
            uint8(3), // 3 consecutive ticks
            confidence
        );
        creRouter.onReport(abi.encode(pool, poolReport));
    }

    function _routeExpiry(address pool) internal {
        bytes memory poolReport = abi.encode(
            uint8(2), // EXPIRE
            int256(0),
            uint8(0),
            uint256(0)
        );
        creRouter.onReport(abi.encode(pool, poolReport));
    }

    function _routeLog(address pool, int256 value, uint8 consecutive) internal {
        bytes memory poolReport = abi.encode(
            uint8(0), // LOG
            value,
            consecutive,
            uint256(0)
        );
        creRouter.onReport(abi.encode(pool, poolReport));
    }

    // Mint CZUSD via CZUSDConsumer (goes through ACE)
    function _mintViaCZUSDConsumer(address recipient, uint256 amount) internal {
        bytes memory report = abi.encode(
            uint8(0), // MINT_CRYPTO
            recipient,
            amount,
            bytes32(0)
        );
        czusdConsumer.onReport(report);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ACE UNIT TESTS — PolicyEngine
// ─────────────────────────────────────────────────────────────────────────────
contract PolicyEngineTest is SurelyFixture {
    function setUp() public { _deploy(); }

    function test_ExtractorSet() public view {
        assertEq(policyEngine.extractors(ON_REPORT_SEL), address(extractor));
    }

    function test_PoliciesAttached() public view {
        address[] memory p = policyEngine.getPolicies(ON_REPORT_SEL);
        assertEq(p.length, 2);
        assertEq(p[0], address(sanctionsPolicy));
        assertEq(p[1], address(volumePolicy));
    }

    function test_RunRevertsWithNoExtractor() public {
        bytes4 unknownSel = bytes4(keccak256("unknownFn()"));
        bytes memory callData = abi.encodeWithSelector(unknownSel);
        vm.expectRevert("PolicyEngine: no extractor");
        policyEngine.run(callData);
    }

    function test_RunPassesCleanAddress() public {
        bytes memory report = abi.encode(uint8(0), alice, uint256(100e6), bytes32(0));
        bytes memory callData = abi.encodeWithSelector(ON_REPORT_SEL, report);
        // Should not revert
        policyEngine.run(callData);
    }

    function test_RunBlocksSanctionedAddress() public {
        sanctionsPolicy.addToDenyList(sanctioned);
        bytes memory report = abi.encode(uint8(0), sanctioned, uint256(100e6), bytes32(0));
        bytes memory callData = abi.encodeWithSelector(ON_REPORT_SEL, report);
        vm.expectRevert("SanctionsPolicy: address sanctioned");
        policyEngine.run(callData);
    }

    function test_AttachMultiplePolicies() public {
        policyEngine.attachPolicy(ON_REPORT_SEL, address(solvencyPolicy));
        address[] memory p = policyEngine.getPolicies(ON_REPORT_SEL);
        assertEq(p.length, 3);
    }

    function test_OnlyOwnerCanSetExtractor() public {
        vm.prank(alice);
        vm.expectRevert();
        policyEngine.setExtractor(ON_REPORT_SEL, address(extractor));
    }

    function test_OnlyOwnerCanAttachPolicy() public {
        vm.prank(alice);
        vm.expectRevert();
        policyEngine.attachPolicy(ON_REPORT_SEL, address(sanctionsPolicy));
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ACE UNIT TESTS — UnifiedExtractor
// ─────────────────────────────────────────────────────────────────────────────
contract UnifiedExtractorTest is SurelyFixture {
    function setUp() public { _deploy(); }

    function test_ExtractCZUSDConsumerPath_MintCrypto() public view {
        // workflowType=0 (MINT_CRYPTO) → CZUSDConsumer path
        bytes memory report = abi.encode(uint8(0), alice, uint256(500e6), bytes32(0));
        bytes memory callData = abi.encodeWithSelector(ON_REPORT_SEL, report);
        bytes[] memory params = extractor.extract(callData);

        assertEq(params.length, 3);
        assertEq(abi.decode(params[0], (address)), alice);      // recipient
        assertEq(abi.decode(params[1], (uint256)), uint256(500e6)); // amount
        assertEq(abi.decode(params[2], (uint8)), uint8(0));     // workflowType
    }

    function test_ExtractCZUSDConsumerPath_MintFiat() public view {
        bytes memory report = abi.encode(uint8(2), bob, uint256(1000e6), bytes32(uint256(0x1234)));
        bytes memory callData = abi.encodeWithSelector(ON_REPORT_SEL, report);
        bytes[] memory params = extractor.extract(callData);

        assertEq(abi.decode(params[0], (address)), bob);
        assertEq(abi.decode(params[1], (uint256)), uint256(1000e6));
        assertEq(abi.decode(params[2], (uint8)), uint8(2));
    }

    function test_ExtractInsurancePoolPath_Settlement() public view {
        // workflowType=5 (> 4) → InsurancePool path
        bytes memory report = abi.encode(uint8(5), int256(-25), uint8(3), uint256(9500));
        bytes memory callData = abi.encodeWithSelector(ON_REPORT_SEL, report);
        bytes[] memory params = extractor.extract(callData);

        assertEq(params.length, 4);
        assertEq(abi.decode(params[0], (uint8)), uint8(5));
        assertEq(abi.decode(params[1], (int256)), int256(-25));
        assertEq(abi.decode(params[2], (uint8)), uint8(3));
        assertEq(abi.decode(params[3], (uint256)), uint256(9500));
    }

    function test_ExtractBoundary_WorkflowType4() public view {
        // workflowType=4 is the last CZUSDConsumer type
        bytes memory report = abi.encode(uint8(4), charlie, uint256(50e6), bytes32(0));
        bytes memory callData = abi.encodeWithSelector(ON_REPORT_SEL, report);
        bytes[] memory params = extractor.extract(callData);
        assertEq(params.length, 3); // CZUSDConsumer path
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ACE UNIT TESTS — SanctionsPolicy
// ─────────────────────────────────────────────────────────────────────────────
contract SanctionsPolicyTest is SurelyFixture {
    function setUp() public { _deploy(); }

    function test_CleanAddressPasses() public view {
        bytes[] memory params = new bytes[](1);
        params[0] = abi.encode(alice);
        sanctionsPolicy.validate(params); // should not revert
    }

    function test_SanctionedAddressReverts() public {
        sanctionsPolicy.addToDenyList(sanctioned);
        bytes[] memory params = new bytes[](1);
        params[0] = abi.encode(sanctioned);
        vm.expectRevert("SanctionsPolicy: address sanctioned");
        sanctionsPolicy.validate(params);
    }

    function test_OwnerCanAddToList() public {
        sanctionsPolicy.addToDenyList(sanctioned);
        assertTrue(sanctionsPolicy.denyList(sanctioned));
    }

    function test_OwnerCanRemoveFromList() public {
        sanctionsPolicy.addToDenyList(sanctioned);
        sanctionsPolicy.removeFromDenyList(sanctioned);
        assertFalse(sanctionsPolicy.denyList(sanctioned));
    }

    function test_NonOwnerCannotAddToList() public {
        vm.prank(alice);
        vm.expectRevert();
        sanctionsPolicy.addToDenyList(sanctioned);
    }

    function test_NonOwnerCannotRemoveFromList() public {
        sanctionsPolicy.addToDenyList(sanctioned);
        vm.prank(alice);
        vm.expectRevert();
        sanctionsPolicy.removeFromDenyList(sanctioned);
    }

    function test_EventEmittedOnAdd() public {
        vm.expectEmit(true, false, false, false);
        emit SanctionsPolicy.AddressDenied(sanctioned);
        sanctionsPolicy.addToDenyList(sanctioned);
    }

    function test_EventEmittedOnRemove() public {
        sanctionsPolicy.addToDenyList(sanctioned);
        vm.expectEmit(true, false, false, false);
        emit SanctionsPolicy.AddressAllowed(sanctioned);
        sanctionsPolicy.removeFromDenyList(sanctioned);
    }

    function test_FreshAddressNotSanctioned() public {
        assertFalse(sanctionsPolicy.denyList(makeAddr("fresh")));
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ACE UNIT TESTS — KYCPolicy
// ─────────────────────────────────────────────────────────────────────────────
contract KYCPolicyTest is SurelyFixture {
    function setUp() public { _deploy(); }

    function test_NoKYCReverts() public {
        bytes[] memory params = new bytes[](1);
        params[0] = abi.encode(alice);
        vm.expectRevert("KYCPolicy: no KYC credential");
        kycPolicy.validate(params);
    }

    function test_KYCdAddressPasses() public {
        kycPolicy.setCredential(alice);
        bytes[] memory params = new bytes[](1);
        params[0] = abi.encode(alice);
        kycPolicy.validate(params); // no revert
    }

    function test_RevokedCredentialBlocks() public {
        kycPolicy.setCredential(alice);
        kycPolicy.revokeCredential(alice);
        bytes[] memory params = new bytes[](1);
        params[0] = abi.encode(alice);
        vm.expectRevert("KYCPolicy: no KYC credential");
        kycPolicy.validate(params);
    }

    function test_HasCredentialView() public {
        assertFalse(kycPolicy.hasCredential(alice));
        kycPolicy.setCredential(alice);
        assertTrue(kycPolicy.hasCredential(alice));
    }

    function test_OnlyOwnerCanSetCredential() public {
        vm.prank(alice);
        vm.expectRevert();
        kycPolicy.setCredential(bob);
    }

    function test_OnlyOwnerCanRevokeCredential() public {
        kycPolicy.setCredential(alice);
        vm.prank(bob);
        vm.expectRevert();
        kycPolicy.revokeCredential(alice);
    }

    function test_CredentialEventEmitted() public {
        vm.expectEmit(true, false, false, true);
        emit KYCPolicy.CredentialSet(alice, true);
        kycPolicy.setCredential(alice);
    }

    function test_RevocationEventEmitted() public {
        kycPolicy.setCredential(alice);
        vm.expectEmit(true, false, false, true);
        emit KYCPolicy.CredentialSet(alice, false);
        kycPolicy.revokeCredential(alice);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ACE UNIT TESTS — PremiumVolumePolicy
// ─────────────────────────────────────────────────────────────────────────────
contract PremiumVolumePolicyTest is SurelyFixture {
    function setUp() public { _deploy(); }

    // Volume policy: min=1e6, max=1_000_000e6

    function test_ValidAmountPasses() public view {
        bytes[] memory params = new bytes[](2);
        params[0] = abi.encode(alice);
        params[1] = abi.encode(uint256(100e6)); // 100 CZUSD
        volumePolicy.validate(params);
    }

    function test_MinAmountPasses() public view {
        bytes[] memory params = new bytes[](2);
        params[0] = abi.encode(alice);
        params[1] = abi.encode(uint256(1e6)); // exactly 1 CZUSD
        volumePolicy.validate(params);
    }

    function test_MaxAmountPasses() public view {
        bytes[] memory params = new bytes[](2);
        params[0] = abi.encode(alice);
        params[1] = abi.encode(uint256(1_000_000e6)); // exactly 1M CZUSD
        volumePolicy.validate(params);
    }

    function test_BelowMinReverts() public {
        bytes[] memory params = new bytes[](2);
        params[0] = abi.encode(alice);
        params[1] = abi.encode(uint256(0)); // 0 CZUSD — below min
        vm.expectRevert("PremiumVolumePolicy: below minimum");
        volumePolicy.validate(params);
    }

    function test_AboveMaxReverts() public {
        bytes[] memory params = new bytes[](2);
        params[0] = abi.encode(alice);
        params[1] = abi.encode(uint256(1_000_001e6)); // above max
        vm.expectRevert("PremiumVolumePolicy: above maximum");
        volumePolicy.validate(params);
    }

    function test_OwnerCanUpdateLimits() public {
        volumePolicy.setLimits(10e6, 500e6);
        assertEq(volumePolicy.minAmount(), 10e6);
        assertEq(volumePolicy.maxAmount(), 500e6);
    }

    function test_InvalidRangeReverts() public {
        vm.expectRevert("PremiumVolumePolicy: invalid range");
        volumePolicy.setLimits(500e6, 100e6); // min > max
    }

    function test_OnlyOwnerCanSetLimits() public {
        vm.prank(alice);
        vm.expectRevert();
        volumePolicy.setLimits(10e6, 500e6);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ACE UNIT TESTS — SolvencyPolicy
// ─────────────────────────────────────────────────────────────────────────────
contract SolvencyPolicyTest is SurelyFixture {
    function setUp() public { _deploy(); }

    // minRatioBps = 12000 (120%)

    function test_SufficientReservesPasses() public view {
        bytes[] memory params = new bytes[](2);
        params[0] = abi.encode(uint256(120e6)); // 120 CZUSD reserves
        params[1] = abi.encode(uint256(100e6)); // 100 CZUSD liabilities → 120% ratio
        solvencyPolicy.validate(params);
    }

    function test_ExactRatioPasses() public view {
        bytes[] memory params = new bytes[](2);
        params[0] = abi.encode(uint256(12000));
        params[1] = abi.encode(uint256(10000)); // exactly 120%
        solvencyPolicy.validate(params);
    }

    function test_UndercollateralizedReverts() public {
        bytes[] memory params = new bytes[](2);
        params[0] = abi.encode(uint256(110e6)); // 110 CZUSD reserves
        params[1] = abi.encode(uint256(100e6)); // 100 CZUSD liabilities → 110% < 120%
        vm.expectRevert("SolvencyPolicy: undercollateralized");
        solvencyPolicy.validate(params);
    }

    function test_ZeroLiabilitiesPasses() public view {
        bytes[] memory params = new bytes[](2);
        params[0] = abi.encode(uint256(0));
        params[1] = abi.encode(uint256(0)); // no liabilities → always solvent
        solvencyPolicy.validate(params);
    }

    function test_OwnerCanUpdateMinRatio() public {
        solvencyPolicy.setMinRatio(15000); // 150%
        assertEq(solvencyPolicy.minRatioBps(), 15000);
    }

    function test_OnlyOwnerCanUpdateMinRatio() public {
        vm.prank(alice);
        vm.expectRevert();
        solvencyPolicy.setMinRatio(15000);
    }

    function test_HighCollateralizationPasses() public view {
        bytes[] memory params = new bytes[](2);
        params[0] = abi.encode(uint256(1_000_000e6)); // massive reserves
        params[1] = abi.encode(uint256(100e6));
        solvencyPolicy.validate(params);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ACE UNIT TESTS — CoolingOffPolicy
// ─────────────────────────────────────────────────────────────────────────────
contract CoolingOffPolicyTest is SurelyFixture {
    function setUp() public {
        _deploy();
        vm.warp(30 days); // ensure block.timestamp > 14 days so subtraction doesn't underflow
    }

    // coolingPeriod = 14 days

    function test_NoPreviousPurchaseAlwaysAllowed() public view {
        bytes[] memory params = new bytes[](1);
        params[0] = abi.encode(uint256(0)); // 0 = no previous purchase
        coolingOffPolicy.validate(params);
    }

    function test_PurchaseAfterCoolingOffPeriodPasses() public {
        uint256 prevPurchase = block.timestamp - 14 days - 1; // 1 second past the period
        bytes[] memory params = new bytes[](1);
        params[0] = abi.encode(prevPurchase);
        coolingOffPolicy.validate(params); // should pass
    }

    function test_RecentPurchaseBlocksReEntry() public {
        uint256 prevPurchase = block.timestamp - 1 days; // only 1 day ago
        bytes[] memory params = new bytes[](1);
        params[0] = abi.encode(prevPurchase);
        vm.expectRevert("CoolingOffPolicy: cooling-off period not yet elapsed");
        coolingOffPolicy.validate(params);
    }

    function test_PurchaseExactlyAtCoolingPeriodBoundaryPasses() public {
        uint256 prevPurchase = block.timestamp - 14 days; // exactly at boundary
        bytes[] memory params = new bytes[](1);
        params[0] = abi.encode(prevPurchase);
        coolingOffPolicy.validate(params);
    }

    function test_PurchaseOneDayBeforeCoolingOffReverts() public {
        uint256 prevPurchase = block.timestamp - 13 days; // 13 days ago, period is 14
        bytes[] memory params = new bytes[](1);
        params[0] = abi.encode(prevPurchase);
        vm.expectRevert("CoolingOffPolicy: cooling-off period not yet elapsed");
        coolingOffPolicy.validate(params);
    }

    function test_OwnerCanAdjustCoolingPeriod() public {
        coolingOffPolicy.setCoolingPeriod(7 days);
        assertEq(coolingOffPolicy.coolingPeriod(), 7 days);

        // With 7-day period, an 8-day-old purchase should now pass
        uint256 prevPurchase = block.timestamp - 8 days;
        bytes[] memory params = new bytes[](1);
        params[0] = abi.encode(prevPurchase);
        coolingOffPolicy.validate(params); // passes with 7d period
    }

    function test_OnlyOwnerCanSetCoolingPeriod() public {
        vm.prank(alice);
        vm.expectRevert();
        coolingOffPolicy.setCoolingPeriod(7 days);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ACE UNIT TESTS — EligibilityPolicy
// ─────────────────────────────────────────────────────────────────────────────
contract EligibilityPolicyTest is SurelyFixture {
    function setUp() public { _deploy(); }

    function test_VerificationTypeZeroAlwaysPasses() public view {
        bytes[] memory params = new bytes[](2);
        params[0] = abi.encode(alice);
        params[1] = abi.encode(uint8(0)); // no verification required
        eligibilityPolicy.validate(params);
    }

    function test_NoProofReverts() public {
        bytes[] memory params = new bytes[](2);
        params[0] = abi.encode(alice);
        params[1] = abi.encode(uint8(1)); // identity required
        vm.expectRevert("EligibilityPolicy: no eligibility proof");
        eligibilityPolicy.validate(params);
    }

    function test_WithProofPasses() public {
        // Store a proof for alice
        bytes32 proof = keccak256("alice-identity-proof");
        eligibilityRegistry.storeProof(alice, 1, proof);

        bytes[] memory params = new bytes[](2);
        params[0] = abi.encode(alice);
        params[1] = abi.encode(uint8(1)); // identity verification type
        eligibilityPolicy.validate(params); // should pass
    }

    function test_WrongVerificationTypeStillReverts() public {
        // Alice has identity proof (type 1) but pool needs flight (type 2)
        bytes32 proof = keccak256("alice-identity-proof");
        eligibilityRegistry.storeProof(alice, 1, proof);

        bytes[] memory params = new bytes[](2);
        params[0] = abi.encode(alice);
        params[1] = abi.encode(uint8(2)); // flight type — alice doesn't have this
        vm.expectRevert("EligibilityPolicy: no eligibility proof");
        eligibilityPolicy.validate(params);
    }

    function test_AllVerificationTypes() public {
        // Store proofs for all types and verify each passes
        for (uint8 vType = 1; vType <= 4; vType++) {
            bytes32 proof = keccak256(abi.encode("proof-for-type", vType));
            eligibilityRegistry.storeProof(alice, vType, proof);

            bytes[] memory params = new bytes[](2);
            params[0] = abi.encode(alice);
            params[1] = abi.encode(vType);
            eligibilityPolicy.validate(params); // all should pass
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ACE INTEGRATION — CZUSDConsumer with full ACE pipeline
// ─────────────────────────────────────────────────────────────────────────────
contract CZUSDConsumerACETest is SurelyFixture {
    function setUp() public { _deploy(); }

    function test_CleanMintPassesACE() public {
        _mintViaCZUSDConsumer(alice, 500e6);
        assertEq(czusd.balanceOf(alice), 500e6);
    }

    function test_SanctionedRecipientBlockedByACE() public {
        sanctionsPolicy.addToDenyList(sanctioned);
        bytes memory report = abi.encode(uint8(0), sanctioned, uint256(500e6), bytes32(0));
        vm.expectRevert("SanctionsPolicy: address sanctioned");
        czusdConsumer.onReport(report);
    }

    function test_ZeroAmountBlockedByVolumePolicy() public {
        bytes memory report = abi.encode(uint8(0), alice, uint256(0), bytes32(0));
        vm.expectRevert("PremiumVolumePolicy: below minimum");
        czusdConsumer.onReport(report);
    }

    function test_ExcessiveAmountBlockedByVolumePolicy() public {
        bytes memory report = abi.encode(uint8(0), alice, uint256(2_000_000e6), bytes32(0));
        vm.expectRevert("PremiumVolumePolicy: above maximum");
        czusdConsumer.onReport(report);
    }

    function test_BurnWorkflowPassesACE() public {
        _mintCZUSD(address(czusdConsumer), 200e6);
        czusd.setConsumer(address(czusdConsumer));
        // alice needs balance to burn
        _mintCZUSD(alice, 200e6);
        bytes memory report = abi.encode(uint8(3), alice, uint256(200e6), bytes32(0)); // BURN=3
        czusdConsumer.onReport(report);
        assertEq(czusd.balanceOf(alice), 0);
    }

    function test_MintFiatWorkflowPassesACE() public {
        bytes memory report = abi.encode(uint8(2), bob, uint256(1000e6), bytes32(0)); // MINT_FIAT=2
        czusdConsumer.onReport(report);
        assertEq(czusd.balanceOf(bob), 1000e6);
    }

    function test_RemoveSanctionUnblocksAddress() public {
        sanctionsPolicy.addToDenyList(sanctioned);
        sanctionsPolicy.removeFromDenyList(sanctioned);
        _mintViaCZUSDConsumer(sanctioned, 100e6);
        assertEq(czusd.balanceOf(sanctioned), 100e6);
    }

    function test_EventEmittedOnSuccessfulReport() public {
        vm.expectEmit(false, false, false, true);
        emit CZUSDConsumer.ReportProcessed(0, alice, 100e6, bytes32(0));
        _mintViaCZUSDConsumer(alice, 100e6);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ComplianceConsumer — CRE-driven compliance oracle
// ─────────────────────────────────────────────────────────────────────────────
contract ComplianceConsumerTest is SurelyFixture {
    function setUp() public {
        _deploy();
        // In production, ComplianceConsumer is the only CRE-driven updater of sanctions and KYC.
        // Transfer ownership so ComplianceConsumer can call addToDenyList and setCredential.
        sanctionsPolicy.transferOwnership(address(complianceConsumer));
        kycPolicy.transferOwnership(address(complianceConsumer));
    }

    function test_StoreEligibilityProof() public {
        bytes32 proof = keccak256("alice-passport-hash");
        bytes memory report = abi.encode(uint8(0), alice, uint8(1), proof); // STORE_ELIGIBILITY
        complianceConsumer.onReport(report);
        assertEq(eligibilityRegistry.getProof(alice, 1), proof);
    }

    function test_AddSanctions() public {
        bytes memory report = abi.encode(uint8(1), sanctioned, uint8(0), bytes32(0)); // ADD_SANCTIONS
        complianceConsumer.onReport(report);
        assertTrue(sanctionsPolicy.denyList(sanctioned));
    }

    function test_SetKYCCredential() public {
        bytes memory report = abi.encode(uint8(2), alice, uint8(0), bytes32(0)); // SET_KYC
        complianceConsumer.onReport(report);
        assertTrue(kycPolicy.hasCredential(alice));
    }

    function test_FullComplianceFlow_CRE() public {
        // Simulate CRE sending a sequence of compliance actions:
        // 1. Set KYC for alice
        complianceConsumer.onReport(abi.encode(uint8(2), alice, uint8(0), bytes32(0)));
        assertTrue(kycPolicy.hasCredential(alice));

        // 2. Store identity proof for alice
        bytes32 proof = keccak256("alice-id-doc-hash");
        complianceConsumer.onReport(abi.encode(uint8(0), alice, uint8(1), proof));
        assertEq(eligibilityRegistry.getProof(alice, 1), proof);

        // 3. Sanction a bad actor
        complianceConsumer.onReport(abi.encode(uint8(1), sanctioned, uint8(0), bytes32(0)));
        assertTrue(sanctionsPolicy.denyList(sanctioned));
    }

    function test_EventEmitted() public {
        vm.expectEmit(false, false, false, true);
        emit ComplianceConsumer.ComplianceReportProcessed(2, alice);
        complianceConsumer.onReport(abi.encode(uint8(2), alice, uint8(0), bytes32(0)));
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// EligibilityRegistry
// ─────────────────────────────────────────────────────────────────────────────
contract EligibilityRegistryTest is SurelyFixture {
    function setUp() public { _deploy(); }

    function test_OwnerCanStoreProof() public {
        bytes32 proof = keccak256("test-proof");
        eligibilityRegistry.storeProof(alice, 1, proof);
        assertEq(eligibilityRegistry.getProof(alice, 1), proof);
    }

    function test_ComplianceConsumerCanStoreProof() public {
        bytes32 proof = keccak256("compliance-proof");
        vm.prank(address(complianceConsumer));
        eligibilityRegistry.storeProof(alice, 1, proof);
        assertEq(eligibilityRegistry.getProof(alice, 1), proof);
    }

    function test_UnauthorizedCannotStoreProof() public {
        vm.prank(alice);
        vm.expectRevert("EligibilityRegistry: unauthorized");
        eligibilityRegistry.storeProof(alice, 1, keccak256("hack"));
    }

    function test_ProofInitiallyZero() public view {
        assertEq(eligibilityRegistry.getProof(alice, 1), bytes32(0));
    }

    function test_DifferentTypesStoredSeparately() public {
        eligibilityRegistry.storeProof(alice, 1, keccak256("identity"));
        eligibilityRegistry.storeProof(alice, 2, keccak256("flight"));
        assertEq(eligibilityRegistry.getProof(alice, 1), keccak256("identity"));
        assertEq(eligibilityRegistry.getProof(alice, 2), keccak256("flight"));
    }

    function test_ProofOverwrite() public {
        eligibilityRegistry.storeProof(alice, 1, keccak256("old-proof"));
        eligibilityRegistry.storeProof(alice, 1, keccak256("new-proof"));
        assertEq(eligibilityRegistry.getProof(alice, 1), keccak256("new-proof"));
    }

    function test_EventEmittedOnStore() public {
        bytes32 proof = keccak256("proof");
        vm.expectEmit(true, false, false, true);
        emit EligibilityRegistry.ProofStored(alice, 1, proof);
        eligibilityRegistry.storeProof(alice, 1, proof);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// CRERouter
// ─────────────────────────────────────────────────────────────────────────────
contract CRERouterTest is SurelyFixture {
    address pool;

    function setUp() public {
        _deploy();
        InsurancePool.PoolConfig memory config = _buildPoolConfig(
            "Test Pool", 0, -20, 0, 100e6, 1000e6, 30
        );
        pool = factory.createPool(config);
        factory.activatePool(pool);
        _mintCZUSD(underwriter, 10000e6);
        vm.prank(underwriter);
        czusd.approve(pool, 10000e6);
        vm.prank(underwriter);
        InsurancePool(pool).deposit(10000e6);
    }

    function test_RegistrationByFactory() public view {
        assertTrue(creRouter.validPools(pool));
    }

    function test_UnregisteredPoolReverts() public {
        address fakePool = makeAddr("fakePool");
        bytes memory poolReport = abi.encode(uint8(0), int256(0), uint8(0), uint256(0));
        vm.expectRevert("CRERouter: invalid pool");
        creRouter.onReport(abi.encode(fakePool, poolReport));
    }

    function test_OwnerCanRegisterPool() public {
        address extra = makeAddr("extra");
        creRouter.registerPool(extra);
        assertTrue(creRouter.validPools(extra));
    }

    function test_NonFactoryNonOwnerCannotRegister() public {
        vm.prank(alice);
        vm.expectRevert("CRERouter: unauthorized");
        creRouter.registerPool(makeAddr("pool"));
    }

    function test_LogActionRoutedToPool() public {
        vm.expectEmit(true, false, false, false);
        emit CRERouter.ReportRouted(pool);
        _routeLog(pool, int256(-5), 1);
    }

    function test_SettlementRoutedToPool() public {
        // Purchase a policy first so settlement can run
        _mintCZUSD(alice, 100e6);
        vm.prank(alice);
        czusd.approve(pool, 100e6);
        vm.prank(alice);
        InsurancePool(pool).purchasePolicy();

        _routeSettlement(pool, 9000);
        assertEq(uint8(InsurancePool(pool).state()), uint8(InsurancePool.PoolState.SETTLED));
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// InsurancePool — Full Lifecycle
// ─────────────────────────────────────────────────────────────────────────────
contract InsurancePoolLifecycleTest is SurelyFixture {
    address pool;

    function setUp() public {
        _deploy();
        InsurancePool.PoolConfig memory config = _buildPoolConfig(
            "BTC Crash Protection", 0, int256(-20), 0, 100e6, 1000e6, 30
        );
        pool = factory.createPool(config);
        _mintCZUSD(underwriter, 50_000e6);
        vm.prank(underwriter);
        czusd.approve(pool, 50_000e6);
        vm.prank(underwriter);
        InsurancePool(pool).deposit(50_000e6);
    }

    // --- State machine ---

    function test_StartsInFundingState() public view {
        assertEq(uint8(InsurancePool(pool).state()), uint8(InsurancePool.PoolState.FUNDING));
    }

    function test_ActivateTransitionsToActive() public {
        factory.activatePool(pool);
        assertEq(uint8(InsurancePool(pool).state()), uint8(InsurancePool.PoolState.ACTIVE));
    }

    function test_CannotPurchaseInFundingState() public {
        _mintCZUSD(alice, 100e6);
        vm.startPrank(alice);
        czusd.approve(pool, 100e6);
        vm.expectRevert("InsurancePool: wrong state");
        InsurancePool(pool).purchasePolicy();
        vm.stopPrank();
    }

    function test_PauseAndUnpause() public {
        factory.activatePool(pool);
        factory.pausePool(pool);
        assertEq(uint8(InsurancePool(pool).state()), uint8(InsurancePool.PoolState.PAUSED));
        factory.unpausePool(pool);
        assertEq(uint8(InsurancePool(pool).state()), uint8(InsurancePool.PoolState.ACTIVE));
    }

    function test_CannotPurchaseInPausedState() public {
        factory.activatePool(pool);
        factory.pausePool(pool);
        _mintCZUSD(alice, 100e6);
        vm.startPrank(alice);
        czusd.approve(pool, 100e6);
        vm.expectRevert("InsurancePool: wrong state");
        InsurancePool(pool).purchasePolicy();
        vm.stopPrank();
    }

    // --- Purchase ---

    function test_PurchaseMintsPolicyNFT() public {
        factory.activatePool(pool);
        _mintCZUSD(alice, 100e6);
        vm.startPrank(alice);
        czusd.approve(pool, 100e6);
        InsurancePool(pool).purchasePolicy();
        vm.stopPrank();

        uint256 tokenId = InsurancePool(pool).policyTokenIds(alice);
        assertTrue(tokenId > 0);
        assertEq(policyNFT.ownerOf(tokenId), alice);
    }

    function test_PurchaseTransfersPremiumToPool() public {
        factory.activatePool(pool);
        _mintCZUSD(alice, 100e6);
        vm.startPrank(alice);
        czusd.approve(pool, 100e6);
        InsurancePool(pool).purchasePolicy();
        vm.stopPrank();

        assertEq(InsurancePool(pool).totalPremiums(), 100e6);
        assertEq(czusd.balanceOf(alice), 0);
    }

    function test_CannotPurchaseTwice() public {
        factory.activatePool(pool);
        _mintCZUSD(alice, 200e6);
        vm.startPrank(alice);
        czusd.approve(pool, 200e6);
        InsurancePool(pool).purchasePolicy();
        vm.expectRevert("InsurancePool: already purchased");
        InsurancePool(pool).purchasePolicy();
        vm.stopPrank();
    }

    function test_MaxCapacityEnforced() public {
        // Create pool with max 2 policyholders
        InsurancePool.PoolConfig memory config = _buildPoolConfig(
            "Limited Pool", 0, int256(-20), 0, 100e6, 1000e6, 30
        );
        config.maxPolicyholders = 2;
        address limitedPool = factory.createPool(config);
        factory.activatePool(limitedPool);

        _mintCZUSD(underwriter, 10000e6);
        vm.prank(underwriter);
        czusd.approve(limitedPool, 10000e6);
        vm.prank(underwriter);
        InsurancePool(limitedPool).deposit(10000e6);

        address buyer1 = makeAddr("b1");
        address buyer2 = makeAddr("b2");
        address buyer3 = makeAddr("b3");

        address[2] memory buyers = [buyer1, buyer2];
        for (uint256 i = 0; i < buyers.length; i++) {
            _mintCZUSD(buyers[i], 100e6);
            vm.startPrank(buyers[i]);
            czusd.approve(limitedPool, 100e6);
            InsurancePool(limitedPool).purchasePolicy();
            vm.stopPrank();
        }

        _mintCZUSD(buyer3, 100e6);
        vm.startPrank(buyer3);
        czusd.approve(limitedPool, 100e6);
        vm.expectRevert("InsurancePool: max capacity");
        InsurancePool(limitedPool).purchasePolicy();
        vm.stopPrank();
    }

    // --- Settlement ---

    function test_SettlementPayoutsToAllHolders() public {
        factory.activatePool(pool);

        address[] memory buyers = new address[](3);
        buyers[0] = alice;
        buyers[1] = bob;
        buyers[2] = charlie;

        for (uint256 i = 0; i < buyers.length; i++) {
            _mintCZUSD(buyers[i], 100e6);
            vm.startPrank(buyers[i]);
            czusd.approve(pool, 100e6);
            InsurancePool(pool).purchasePolicy();
            vm.stopPrank();
        }

        assertEq(InsurancePool(pool).getPolicyholders().length, 3);

        _routeSettlement(pool, 9500); // 95% confidence

        // All policyholders receive maxPayoutPerPolicy (1000 CZUSD each)
        for (uint256 i = 0; i < buyers.length; i++) {
            assertEq(czusd.balanceOf(buyers[i]), 1000e6);
        }
        assertEq(uint8(InsurancePool(pool).state()), uint8(InsurancePool.PoolState.SETTLED));
    }

    function test_LowConfidenceSettlementReverts() public {
        factory.activatePool(pool);
        _mintCZUSD(alice, 100e6);
        vm.prank(alice);
        czusd.approve(pool, 100e6);
        vm.prank(alice);
        InsurancePool(pool).purchasePolicy();

        bytes memory poolReport = abi.encode(
            uint8(1), // SETTLEMENT
            int256(-25),
            uint8(3),
            uint256(7000) // only 70% confidence — below 80% threshold
        );
        vm.expectRevert("InsurancePool: confidence too low");
        creRouter.onReport(abi.encode(pool, poolReport));
    }

    function test_ExactConfidenceBoundary_80Percent() public {
        factory.activatePool(pool);
        _mintCZUSD(alice, 100e6);
        vm.prank(alice);
        czusd.approve(pool, 100e6);
        vm.prank(alice);
        InsurancePool(pool).purchasePolicy();

        // Exactly 80% (8000 bps) — should revert (require > 8000, not >=)
        bytes memory poolReport = abi.encode(uint8(1), int256(-25), uint8(3), uint256(8000));
        vm.expectRevert("InsurancePool: confidence too low");
        creRouter.onReport(abi.encode(pool, poolReport));
    }

    function test_ConfidenceJustAbove80Settles() public {
        factory.activatePool(pool);
        _mintCZUSD(alice, 100e6);
        vm.prank(alice);
        czusd.approve(pool, 100e6);
        vm.prank(alice);
        InsurancePool(pool).purchasePolicy();

        _routeSettlement(pool, 8001); // just above 80%
        assertEq(uint8(InsurancePool(pool).state()), uint8(InsurancePool.PoolState.SETTLED));
    }

    function test_SettlementCapsPayoutAtPoolBalance() public {
        // Create pool with low underwriting — can't pay full maxPayout to many holders
        InsurancePool.PoolConfig memory config = _buildPoolConfig(
            "Low Cap Pool", 0, int256(-20), 0, 100e6, 1000e6, 30
        );
        address lowCapPool = factory.createPool(config);
        factory.activatePool(lowCapPool);

        // Only deposit 500 CZUSD underwriting — not enough for 3 × 1000 CZUSD payouts
        _mintCZUSD(underwriter, 500e6);
        vm.prank(underwriter);
        czusd.approve(lowCapPool, 500e6);
        vm.prank(underwriter);
        InsurancePool(lowCapPool).deposit(500e6);

        address b1 = makeAddr("lowcap-b1");
        address b2 = makeAddr("lowcap-b2");

        address[2] memory lowCapBuyers = [b1, b2];
        for (uint256 i = 0; i < lowCapBuyers.length; i++) {
            _mintCZUSD(lowCapBuyers[i], 100e6);
            vm.startPrank(lowCapBuyers[i]);
            czusd.approve(lowCapPool, 100e6);
            InsurancePool(lowCapPool).purchasePolicy();
            vm.stopPrank();
        }

        // Pool has 500 + 200 = 700 CZUSD, 2 holders, so 350 each (capped from 1000)
        _routeSettlement(lowCapPool, 9000);

        assertEq(czusd.balanceOf(b1), 350e6);
        assertEq(czusd.balanceOf(b2), 350e6);
    }

    function test_SettlementUpdatesNFTStatus() public {
        factory.activatePool(pool);
        _mintCZUSD(alice, 100e6);
        vm.prank(alice);
        czusd.approve(pool, 100e6);
        vm.prank(alice);
        InsurancePool(pool).purchasePolicy();

        uint256 tokenId = InsurancePool(pool).policyTokenIds(alice);
        _routeSettlement(pool, 9000);

        PolicyNFT.PolicyData memory data = policyNFT.getPolicyData(tokenId);
        assertEq(uint8(data.status), uint8(PolicyNFT.PolicyStatus.SETTLED));
        assertEq(data.payoutAmount, 1000e6);
    }

    // --- Expiry ---

    function test_ExpiryAfterEndTimestamp() public {
        factory.activatePool(pool);
        _mintCZUSD(alice, 100e6);
        vm.prank(alice);
        czusd.approve(pool, 100e6);
        vm.prank(alice);
        InsurancePool(pool).purchasePolicy();

        vm.warp(block.timestamp + 31 days);
        _routeExpiry(pool);

        assertEq(uint8(InsurancePool(pool).state()), uint8(InsurancePool.PoolState.EXPIRED));
    }

    function test_ExpiryBeforeEndTimestampReverts() public {
        factory.activatePool(pool);
        // Do NOT warp time — pool hasn't expired yet
        bytes memory poolReport = abi.encode(uint8(2), int256(0), uint8(0), uint256(0));
        vm.expectRevert("InsurancePool: not expired");
        creRouter.onReport(abi.encode(pool, poolReport));
    }

    function test_ExpiryUpdatesNFTStatusAndReturnsRemainingToCreator() public {
        factory.activatePool(pool);
        _mintCZUSD(alice, 100e6);
        vm.prank(alice);
        czusd.approve(pool, 100e6);
        vm.prank(alice);
        InsurancePool(pool).purchasePolicy();

        uint256 tokenId = InsurancePool(pool).policyTokenIds(alice);
        uint256 creatorBalBefore = czusd.balanceOf(deployer);

        vm.warp(block.timestamp + 31 days);
        _routeExpiry(pool);

        // NFT marked expired
        assertEq(uint8(policyNFT.getPolicyData(tokenId).status), uint8(PolicyNFT.PolicyStatus.EXPIRED));
        // Remaining funds returned to creator (deployer in this test)
        assertGt(czusd.balanceOf(deployer), creatorBalBefore);
    }

    function test_LogActionEmitsEvent() public {
        factory.activatePool(pool);
        vm.expectEmit(false, false, false, false);
        emit InsurancePool.MonitoringTick(int256(-5), true, 1, block.timestamp);
        _routeLog(pool, int256(-5), 1);
    }

    // --- Deposit ---

    function test_DepositInFundingState() public view {
        assertEq(InsurancePool(pool).totalUnderwritten(), 50_000e6);
    }

    function test_DepositInActiveState() public {
        factory.activatePool(pool);
        _mintCZUSD(bob, 5000e6);
        vm.prank(bob);
        czusd.approve(pool, 5000e6);
        vm.prank(bob);
        InsurancePool(pool).deposit(5000e6);
        assertEq(InsurancePool(pool).underwriterDeposits(bob), 5000e6);
    }

    function test_CannotDepositInSettledState() public {
        factory.activatePool(pool);
        _mintCZUSD(alice, 100e6);
        vm.prank(alice);
        czusd.approve(pool, 100e6);
        vm.prank(alice);
        InsurancePool(pool).purchasePolicy();
        _routeSettlement(pool, 9000);

        _mintCZUSD(bob, 1000e6);
        vm.prank(bob);
        czusd.approve(pool, 1000e6);
        vm.expectRevert("InsurancePool: wrong state");
        vm.prank(bob);
        InsurancePool(pool).deposit(1000e6);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// InsurancePool — Eligibility-gated Pools (verificationType != 0)
// ─────────────────────────────────────────────────────────────────────────────
contract InsurancePoolEligibilityTest is SurelyFixture {
    address pool; // verificationType = 1 (identity)

    function setUp() public {
        _deploy();
        InsurancePool.PoolConfig memory config = _buildPoolConfig(
            "USDC Depeg Shield", 0, int256(-3), 1, 25e6, 500e6, 30 // verificationType = 1 (identity)
        );
        pool = factory.createPool(config);
        factory.activatePool(pool);

        _mintCZUSD(underwriter, 50_000e6);
        vm.prank(underwriter);
        czusd.approve(pool, 50_000e6);
        vm.prank(underwriter);
        InsurancePool(pool).deposit(50_000e6);
    }

    function test_NoProofReverts() public {
        _mintCZUSD(alice, 25e6);
        vm.startPrank(alice);
        czusd.approve(pool, 25e6);
        vm.expectRevert("InsurancePool: no eligibility proof");
        InsurancePool(pool).purchasePolicy();
        vm.stopPrank();
    }

    function test_WithProofPasses() public {
        // Store identity proof via ComplianceConsumer (simulating CRE)
        bytes32 proof = keccak256("alice-passport-verified");
        complianceConsumer.onReport(abi.encode(uint8(0), alice, uint8(1), proof));

        _mintCZUSD(alice, 25e6);
        vm.startPrank(alice);
        czusd.approve(pool, 25e6);
        InsurancePool(pool).purchasePolicy();
        vm.stopPrank();

        assertTrue(InsurancePool(pool).policyTokenIds(alice) > 0);
    }

    function test_ProofStoredInNFT() public {
        bytes32 proof = keccak256("alice-passport-verified");
        complianceConsumer.onReport(abi.encode(uint8(0), alice, uint8(1), proof));

        _mintCZUSD(alice, 25e6);
        vm.startPrank(alice);
        czusd.approve(pool, 25e6);
        InsurancePool(pool).purchasePolicy();
        vm.stopPrank();

        uint256 tokenId = InsurancePool(pool).policyTokenIds(alice);
        PolicyNFT.PolicyData memory data = policyNFT.getPolicyData(tokenId);
        assertEq(data.eligibilityProofHash, proof);
    }

    function test_WrongVerificationTypeBlocked() public {
        // Alice has flight proof (type=2) but pool needs identity (type=1)
        eligibilityRegistry.storeProof(alice, 2, keccak256("flight-proof"));

        _mintCZUSD(alice, 25e6);
        vm.startPrank(alice);
        czusd.approve(pool, 25e6);
        vm.expectRevert("InsurancePool: no eligibility proof");
        InsurancePool(pool).purchasePolicy();
        vm.stopPrank();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// SurelyFactory
// ─────────────────────────────────────────────────────────────────────────────
contract SurelyFactoryTest is SurelyFixture {
    function setUp() public { _deploy(); }

    function test_CreatePoolDeploysAndRegisters() public {
        InsurancePool.PoolConfig memory config = _buildPoolConfig(
            "Test", 0, int256(-20), 0, 100e6, 1000e6, 30
        );
        address pool = factory.createPool(config);
        assertTrue(factory.isPool(pool));
        assertEq(factory.poolCount(), 1);
        assertTrue(creRouter.validPools(pool));
        assertTrue(policyNFT.authorizedPools(pool));
    }

    function test_ActivateOnlyByOwner() public {
        InsurancePool.PoolConfig memory config = _buildPoolConfig(
            "Test", 0, int256(-20), 0, 100e6, 1000e6, 30
        );
        address pool = factory.createPool(config);
        vm.prank(alice);
        vm.expectRevert();
        factory.activatePool(pool);
    }

    function test_ActivateNonPoolReverts() public {
        vm.expectRevert("SurelyFactory: not a pool");
        factory.activatePool(makeAddr("fake"));
    }

    function test_GetAllPools() public {
        for (uint256 i = 0; i < 3; i++) {
            InsurancePool.PoolConfig memory config = _buildPoolConfig(
                string.concat("Pool ", vm.toString(i)), 0, int256(-20), 0, 100e6, 1000e6, 30
            );
            factory.createPool(config);
        }
        assertEq(factory.getAllPools().length, 3);
    }

    function test_GetActivePools() public {
        InsurancePool.PoolConfig memory config = _buildPoolConfig(
            "A", 0, int256(-20), 0, 100e6, 1000e6, 30
        );
        address p1 = factory.createPool(config);
        config.name = "B";
        factory.createPool(config); // stays FUNDING

        factory.activatePool(p1);
        address[] memory active = factory.getActivePools();
        assertEq(active.length, 1);
        assertEq(active[0], p1);
    }

    function test_CreatorSet() public {
        InsurancePool.PoolConfig memory config = _buildPoolConfig(
            "Owned", 0, int256(-20), 0, 100e6, 1000e6, 30
        );
        vm.prank(alice);
        address pool = factory.createPool(config);
        assertEq(InsurancePool(pool).creator(), alice);
    }

    function test_PoolEventEmitted() public {
        InsurancePool.PoolConfig memory config = _buildPoolConfig(
            "EventTest", 0, int256(-20), 0, 100e6, 1000e6, 30
        );
        vm.expectEmit(false, true, false, false);
        emit SurelyFactory.PoolCreated(address(0), deployer, "EventTest");
        factory.createPool(config);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// PolicyNFT
// ─────────────────────────────────────────────────────────────────────────────
contract PolicyNFTTest is SurelyFixture {
    function setUp() public { _deploy(); }

    function test_UnauthorizedCannotMint() public {
        vm.prank(alice);
        vm.expectRevert("PolicyNFT: not authorized pool");
        policyNFT.mint(alice, makeAddr("pool"), 100e6, 1000e6, block.timestamp + 30 days, bytes32(0));
    }

    function test_PolicyDataCorrectAfterMint() public {
        InsurancePool.PoolConfig memory config = _buildPoolConfig(
            "NFT Test", 0, int256(-20), 0, 100e6, 1000e6, 30
        );
        address pool = _createAndActivatePool(config);

        _mintCZUSD(underwriter, 50_000e6);
        vm.prank(underwriter);
        czusd.approve(pool, 50_000e6);
        vm.prank(underwriter);
        InsurancePool(pool).deposit(50_000e6);

        _mintCZUSD(alice, 100e6);
        vm.startPrank(alice);
        czusd.approve(pool, 100e6);
        InsurancePool(pool).purchasePolicy();
        vm.stopPrank();

        uint256 tokenId = InsurancePool(pool).policyTokenIds(alice);
        PolicyNFT.PolicyData memory data = policyNFT.getPolicyData(tokenId);

        assertEq(data.pool, pool);
        assertEq(data.holder, alice);
        assertEq(data.premium, 100e6);
        assertEq(data.coverage, 1000e6);
        assertEq(uint8(data.status), uint8(PolicyNFT.PolicyStatus.ACTIVE));
        assertEq(data.payoutAmount, 0);
    }

    function test_GetPoliciesByHolder() public {
        InsurancePool.PoolConfig memory config = _buildPoolConfig(
            "Multi Pool", 0, int256(-20), 0, 100e6, 1000e6, 30
        );
        address pool1 = _createAndActivatePool(config);
        config.name = "Multi Pool 2";
        address pool2 = _createAndActivatePool(config);

        address[2] memory multiPools = [pool1, pool2];
        for (uint256 i = 0; i < multiPools.length; i++) {
            _mintCZUSD(underwriter, 50_000e6);
            vm.prank(underwriter);
            czusd.approve(multiPools[i], 50_000e6);
            vm.prank(underwriter);
            InsurancePool(multiPools[i]).deposit(50_000e6);
        }

        _mintCZUSD(alice, 200e6);
        vm.startPrank(alice);
        czusd.approve(pool1, 100e6);
        czusd.approve(pool2, 100e6);
        InsurancePool(pool1).purchasePolicy();
        InsurancePool(pool2).purchasePolicy();
        vm.stopPrank();

        uint256[] memory alicePolicies = policyNFT.getPoliciesByHolder(alice);
        assertEq(alicePolicies.length, 2);
    }

    function test_UpdateStatusWrongPoolReverts() public {
        InsurancePool.PoolConfig memory config = _buildPoolConfig(
            "Pool A", 0, int256(-20), 0, 100e6, 1000e6, 30
        );
        address poolA = _createAndActivatePool(config);
        config.name = "Pool B";
        address poolB = _createAndActivatePool(config);

        address[2] memory abPools = [poolA, poolB];
        for (uint256 i = 0; i < abPools.length; i++) {
            _mintCZUSD(underwriter, 50_000e6);
            vm.prank(underwriter);
            czusd.approve(abPools[i], 50_000e6);
            vm.prank(underwriter);
            InsurancePool(abPools[i]).deposit(50_000e6);
        }

        _mintCZUSD(alice, 100e6);
        vm.startPrank(alice);
        czusd.approve(poolA, 100e6);
        InsurancePool(poolA).purchasePolicy();
        vm.stopPrank();

        uint256 tokenId = InsurancePool(poolA).policyTokenIds(alice);

        // Pool B tries to update Pool A's token — should revert
        vm.prank(poolB);
        vm.expectRevert("PolicyNFT: wrong pool");
        policyNFT.updateStatus(tokenId, PolicyNFT.PolicyStatus.SETTLED, 1000e6);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// END-TO-END INTEGRATION — Full Realistic Demo Flows
// ─────────────────────────────────────────────────────────────────────────────
contract E2EIntegrationTest is SurelyFixture {
    function setUp() public { _deploy(); }

    // BTC Crash Pool — no eligibility, open to all (minus sanctions)
    function test_E2E_BTCCrashPool_FullFlow() public {
        // 1. Deploy BTC Crash Protection pool
        InsurancePool.PoolConfig memory config = _buildPoolConfig(
            "BTC Crash Protection", 0, int256(-20), 0, 50e6, 1000e6, 30
        );
        address pool = factory.createPool(config);

        // 2. Underwriter capitalises the pool with 10,000 CZUSD
        _mintCZUSD(underwriter, 10_000e6);
        vm.prank(underwriter);
        czusd.approve(pool, 10_000e6);
        vm.prank(underwriter);
        InsurancePool(pool).deposit(10_000e6);

        // 3. Factory activates pool
        factory.activatePool(pool);

        // 4. Three buyers purchase policies via CZUSD minted through ACE pipeline
        address[] memory buyers = new address[](3);
        buyers[0] = alice;
        buyers[1] = bob;
        buyers[2] = charlie;

        for (uint256 i = 0; i < buyers.length; i++) {
            // Mint via CZUSDConsumer (goes through ACE sanctions + volume check)
            _mintViaCZUSDConsumer(buyers[i], 50e6);
            vm.startPrank(buyers[i]);
            czusd.approve(pool, 50e6);
            InsurancePool(pool).purchasePolicy();
            vm.stopPrank();
        }

        assertEq(InsurancePool(pool).getPolicyholders().length, 3);
        assertEq(InsurancePool(pool).totalPremiums(), 150e6);

        // 5. CRE monitoring runs — logs consecutive ticks as BTC falls
        _routeLog(pool, int256(-15), 1);
        _routeLog(pool, int256(-18), 2);
        _routeLog(pool, int256(-22), 3); // threshold breached

        // 6. CRE routes settlement at 95% confidence
        _routeSettlement(pool, 9500);

        // 7. Verify all policyholders received 1000 CZUSD each
        for (uint256 i = 0; i < buyers.length; i++) {
            assertEq(czusd.balanceOf(buyers[i]), 1000e6); // got payout, spent 50 on premium
        }

        assertEq(uint8(InsurancePool(pool).state()), uint8(InsurancePool.PoolState.SETTLED));
    }

    // USDC Depeg Shield — requires identity verification
    function test_E2E_USDCDepegPool_EligibilityGated() public {
        // 1. Deploy identity-gated pool
        InsurancePool.PoolConfig memory config = _buildPoolConfig(
            "USDC Depeg Shield", 0, int256(-3), 1, 25e6, 500e6, 30 // verificationType=1 (identity)
        );
        address pool = factory.createPool(config);
        factory.activatePool(pool);

        _mintCZUSD(underwriter, 50_000e6);
        vm.prank(underwriter);
        czusd.approve(pool, 50_000e6);
        vm.prank(underwriter);
        InsurancePool(pool).deposit(50_000e6);

        // 2. CRE ComplianceConsumer stores identity proof for alice (simulates KYC pipeline)
        bytes32 aliceProof = keccak256(abi.encode("alice-passport-EU-123456"));
        complianceConsumer.onReport(abi.encode(uint8(0), alice, uint8(1), aliceProof));

        // 3. Bob tries to buy without KYC — reverts
        _mintCZUSD(bob, 25e6);
        vm.startPrank(bob);
        czusd.approve(pool, 25e6);
        vm.expectRevert("InsurancePool: no eligibility proof");
        InsurancePool(pool).purchasePolicy();
        vm.stopPrank();

        // 4. Alice buys with verified identity proof
        _mintViaCZUSDConsumer(alice, 25e6);
        vm.startPrank(alice);
        czusd.approve(pool, 25e6);
        InsurancePool(pool).purchasePolicy();
        vm.stopPrank();

        // 5. Proof hash stored in NFT for auditability
        uint256 tokenId = InsurancePool(pool).policyTokenIds(alice);
        assertEq(policyNFT.getPolicyData(tokenId).eligibilityProofHash, aliceProof);

        // 6. USDC depegs — settlement at 92% confidence
        _routeSettlement(pool, 9200);
        assertEq(czusd.balanceOf(alice), 500e6); // full 500 CZUSD payout
    }

    // Full ACE compliance flow — CRE compliance oracle sanctions bad actor, ACE blocks minting
    function test_E2E_SanctionsBlockMinting() public {
        // In production, ComplianceConsumer is the authorized writer for SanctionsPolicy.
        // Transfer ownership to reflect the real architecture.
        sanctionsPolicy.transferOwnership(address(complianceConsumer));

        // 1. CRE compliance workflow detects eve is sanctioned — ComplianceConsumer writes to SanctionsPolicy
        complianceConsumer.onReport(abi.encode(uint8(1), eve, uint8(0), bytes32(0))); // ADD_SANCTIONS
        assertTrue(sanctionsPolicy.denyList(eve));

        // 2. Eve tries to acquire CZUSD — ACE SanctionsPolicy blocks the mint at the CZUSDConsumer level
        bytes memory report = abi.encode(uint8(0), eve, uint256(100e6), bytes32(0));
        vm.expectRevert("SanctionsPolicy: address sanctioned");
        czusdConsumer.onReport(report);

        // Eve has zero CZUSD — defense-in-depth: blocked before she can touch any pool
        assertEq(czusd.balanceOf(eve), 0);
    }

    // Cooling-off period prevents immediate re-purchase in the same pool lifecycle
    function test_E2E_CoolingOffPeriod_ReEntryBlocked() public {
        // Deploy pool with cooling-off policy attached via a custom setup
        // CoolingOff is validated independently (would be wired via PolicyEngine for purchasePolicy in prod)
        uint256 prevPurchaseTs = block.timestamp;

        bytes[] memory params = new bytes[](1);
        params[0] = abi.encode(prevPurchaseTs);

        // Immediately after purchase — blocked
        vm.expectRevert("CoolingOffPolicy: cooling-off period not yet elapsed");
        coolingOffPolicy.validate(params);

        // Warp 14 days — now allowed
        vm.warp(block.timestamp + 14 days);
        coolingOffPolicy.validate(params); // passes
    }

    // Flight Delay pool with flight verification type
    function test_E2E_FlightDelayPool() public {
        InsurancePool.PoolConfig memory config = _buildPoolConfig(
            "Flight Delay Cover", 1, int256(3), 2, 30e6, 300e6, 7 // GT 3h delay, flight verification
        );
        address pool = factory.createPool(config);
        factory.activatePool(pool);

        _mintCZUSD(underwriter, 50_000e6);
        vm.prank(underwriter);
        czusd.approve(pool, 50_000e6);
        vm.prank(underwriter);
        InsurancePool(pool).deposit(50_000e6);

        // Alice provides flight booking reference via CRE eligibility workflow
        bytes32 flightProof = keccak256(abi.encode("alice-AA123-2026-03-15-CONFIRMED"));
        complianceConsumer.onReport(abi.encode(uint8(0), alice, uint8(2), flightProof)); // verificationType=2 flight

        _mintViaCZUSDConsumer(alice, 30e6);
        vm.startPrank(alice);
        czusd.approve(pool, 30e6);
        InsurancePool(pool).purchasePolicy();
        vm.stopPrank();

        // Flight is delayed — trigger fires, settlement at 90% confidence
        _routeSettlement(pool, 9000);
        assertEq(czusd.balanceOf(alice), 300e6);
    }

    // Pool expires without trigger — all NFTs marked expired, remaining capital returned
    function test_E2E_PoolExpiresNoTrigger() public {
        InsurancePool.PoolConfig memory config = _buildPoolConfig(
            "Drought Cover", 0, int256(5), 0, 100e6, 2000e6, 90
        );
        address pool = factory.createPool(config);
        factory.activatePool(pool);

        _mintCZUSD(underwriter, 50_000e6);
        vm.prank(underwriter);
        czusd.approve(pool, 50_000e6);
        vm.prank(underwriter);
        InsurancePool(pool).deposit(50_000e6);

        // Farmers buy policies
        _mintViaCZUSDConsumer(alice, 100e6);
        vm.prank(alice);
        czusd.approve(pool, 100e6);
        vm.prank(alice);
        InsurancePool(pool).purchasePolicy();

        // 90 days pass — no drought trigger fires
        vm.warp(block.timestamp + 91 days);
        _routeExpiry(pool);

        // Alice's NFT is expired, no payout
        uint256 tokenId = InsurancePool(pool).policyTokenIds(alice);
        PolicyNFT.PolicyData memory data = policyNFT.getPolicyData(tokenId);
        assertEq(uint8(data.status), uint8(PolicyNFT.PolicyStatus.EXPIRED));
        assertEq(data.payoutAmount, 0);
        assertEq(uint8(InsurancePool(pool).state()), uint8(InsurancePool.PoolState.EXPIRED));
    }
}
