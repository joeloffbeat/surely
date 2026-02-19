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

contract InsurancePoolTest is Test {
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
    address buyer = makeAddr("buyer");

    function setUp() public {
        // Deploy everything
        czusd = new CZUSD();
        policyEngine = new PolicyEngine();
        extractor = new UnifiedExtractor();
        sanctionsPolicy = new SanctionsPolicy();
        kycPolicy = new KYCPolicy();
        volumePolicy = new PremiumVolumePolicy(1e6, 1_000_000e6);
        solvencyPolicy = new SolvencyPolicy(12000);
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

        // Configure
        czusd.setConsumer(address(czusdConsumer));
        creRouter.setFactory(address(factory));
        eligibilityRegistry.setComplianceConsumer(address(complianceConsumer));
        policyNFT.transferOwnership(address(factory));

        bytes4 onReportSelector = bytes4(keccak256("onReport(bytes)"));
        policyEngine.setExtractor(onReportSelector, address(extractor));
        policyEngine.attachPolicy(onReportSelector, address(sanctionsPolicy));
        policyEngine.attachPolicy(onReportSelector, address(volumePolicy));
    }

    function _createPool() internal returns (address) {
        InsurancePool.PoolConfig memory config = InsurancePool.PoolConfig({
            name: "BTC Crash Protection",
            description: "Pays out if BTC drops >20% in 24h",
            comparison: 0, // LT
            triggerThreshold: -20,
            duration: 1,
            consensusMethod: 0, // byMedian
            verificationCadence: 600, // 10 min
            eligibilityAgreementHash: keccak256("eligibility"),
            settlementAgreementHash: keccak256("settlement"),
            eligibilityTldrHash: keccak256("eligibility-tldr"),
            settlementTldrHash: keccak256("settlement-tldr"),
            verificationType: 0, // none
            premiumAmount: 100e6, // 100 CZUSD
            maxPayoutPerPolicy: 1000e6, // 1000 CZUSD
            poolEndTimestamp: block.timestamp + 30 days,
            minPolicyholders: 1,
            maxPolicyholders: 100
        });

        return factory.createPool(config);
    }

    function _mintCZUSD(address to, uint256 amount) internal {
        // Use CZUSDConsumer to mint
        bytes memory report = abi.encode(
            uint8(0), // MINT_CRYPTO
            to,
            amount,
            bytes32(0)
        );
        // Call onReport on CZUSDConsumer (bypass ACE for test by removing policies temporarily)
        // Instead, directly set consumer and mint
        vm.prank(address(czusdConsumer));
        czusd.mint(to, amount);
    }

    function test_CreatePool() public {
        address pool = _createPool();
        assertTrue(pool != address(0));
        assertTrue(factory.isPool(pool));
        assertEq(factory.poolCount(), 1);
    }

    function test_ActivatePool() public {
        address pool = _createPool();
        assertEq(uint8(InsurancePool(pool).state()), uint8(InsurancePool.PoolState.FUNDING));

        factory.activatePool(pool);
        assertEq(uint8(InsurancePool(pool).state()), uint8(InsurancePool.PoolState.ACTIVE));
    }

    function test_DepositAndPurchase() public {
        address pool = _createPool();

        // Underwriter deposits
        _mintCZUSD(underwriter, 10000e6);
        vm.startPrank(underwriter);
        czusd.approve(pool, 10000e6);
        InsurancePool(pool).deposit(10000e6);
        vm.stopPrank();

        assertEq(InsurancePool(pool).totalUnderwritten(), 10000e6);

        // Activate pool
        factory.activatePool(pool);

        // Buyer purchases policy
        _mintCZUSD(buyer, 100e6);
        vm.startPrank(buyer);
        czusd.approve(pool, 100e6);
        InsurancePool(pool).purchasePolicy();
        vm.stopPrank();

        assertEq(InsurancePool(pool).totalPremiums(), 100e6);
        assertTrue(InsurancePool(pool).policyTokenIds(buyer) > 0);
    }

    function test_Settlement() public {
        address pool = _createPool();

        // Setup: deposit + activate + purchase
        _mintCZUSD(underwriter, 10000e6);
        vm.prank(underwriter);
        czusd.approve(pool, 10000e6);
        vm.prank(underwriter);
        InsurancePool(pool).deposit(10000e6);

        factory.activatePool(pool);

        _mintCZUSD(buyer, 100e6);
        vm.prank(buyer);
        czusd.approve(pool, 100e6);
        vm.prank(buyer);
        InsurancePool(pool).purchasePolicy();

        // Simulate settlement via CRERouter
        bytes memory poolReport = abi.encode(
            uint8(1), // SETTLEMENT
            int256(-25),
            uint8(1),
            uint256(9000) // 90% confidence
        );
        bytes memory routerReport = abi.encode(pool, poolReport);

        vm.prank(address(this)); // router owner
        creRouter.registerPool(pool); // already registered by factory, but re-register
        vm.prank(address(creRouter));
        // Can't call onReport directly on pool since only router can
        // Instead, call via router
        // But router.onReport needs to be called externally
        creRouter.onReport(routerReport);

        assertEq(uint8(InsurancePool(pool).state()), uint8(InsurancePool.PoolState.SETTLED));
    }

    function test_PoolExpiry() public {
        address pool = _createPool();
        factory.activatePool(pool);

        // Warp past end timestamp
        vm.warp(block.timestamp + 31 days);

        bytes memory poolReport = abi.encode(
            uint8(2), // EXPIRE
            int256(0),
            uint8(0),
            uint256(0)
        );
        bytes memory routerReport = abi.encode(pool, poolReport);

        creRouter.onReport(routerReport);
        assertEq(uint8(InsurancePool(pool).state()), uint8(InsurancePool.PoolState.EXPIRED));
    }

    function test_SanctionedAddressBlocked() public {
        address sanctioned = makeAddr("sanctioned");
        sanctionsPolicy.addToDenyList(sanctioned);
        assertTrue(sanctionsPolicy.denyList(sanctioned));
    }

    function test_GetActivePools() public {
        address pool1 = _createPool();
        address pool2 = _createPool();

        factory.activatePool(pool1);
        // pool2 stays in FUNDING

        address[] memory active = factory.getActivePools();
        assertEq(active.length, 1);
        assertEq(active[0], pool1);
    }
}
