// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {CZUSD} from "../src/CZUSD.sol";
import {SurelyFactory} from "../src/SurelyFactory.sol";
import {InsurancePool} from "../src/InsurancePool.sol";

contract Seed is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // Deployed addresses
        CZUSD czusd = CZUSD(0xA8D24aDd4E9CE85e6875251a4a0a796BAa2acfCF);
        SurelyFactory factory = SurelyFactory(0x327f771EE67BeD16C7d8C3646c996e09d0e7566e);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Mint 1M CZUSD to deployer
        czusd.ownerMint(deployer, 1_000_000e6);
        console.log("Minted 1M CZUSD to deployer");

        // 2. Create 4 pools
        // Pool 1: Crypto Crash Shield
        address pool1 = factory.createPool(InsurancePool.PoolConfig({
            name: "Crypto Crash Shield",
            description: "Protection against sudden BTC price drops exceeding 20% within a 24-hour window.",
            comparison: 1, // GT
            triggerThreshold: 20,
            duration: 12,
            consensusMethod: 0, // byMedian
            verificationCadence: 300, // 5 min
            eligibilityAgreementHash: keccak256("crypto-crash-eligibility-v1"),
            settlementAgreementHash: keccak256("crypto-crash-settlement-v1"),
            eligibilityTldrHash: keccak256("crypto-crash-eligibility-tldr-v1"),
            settlementTldrHash: keccak256("crypto-crash-settlement-tldr-v1"),
            verificationType: 0, // none
            premiumAmount: 50e6,
            maxPayoutPerPolicy: 5000e6,
            poolEndTimestamp: block.timestamp + 30 days,
            minPolicyholders: 1,
            maxPolicyholders: 100
        }));
        console.log("Pool 1 (Crypto Crash Shield):", pool1);

        // Pool 2: Stablecoin Depeg Guard
        address pool2 = factory.createPool(InsurancePool.PoolConfig({
            name: "Stablecoin Depeg Guard",
            description: "Coverage for USDC depegging below $0.95 for more than 1 hour.",
            comparison: 0, // LT
            triggerThreshold: 9500,
            duration: 12,
            consensusMethod: 1, // byMajority
            verificationCadence: 60, // 1 min
            eligibilityAgreementHash: keccak256("depeg-eligibility-v1"),
            settlementAgreementHash: keccak256("depeg-settlement-v1"),
            eligibilityTldrHash: keccak256("depeg-eligibility-tldr-v1"),
            settlementTldrHash: keccak256("depeg-settlement-tldr-v1"),
            verificationType: 0, // none
            premiumAmount: 25e6,
            maxPayoutPerPolicy: 2500e6,
            poolEndTimestamp: block.timestamp + 30 days,
            minPolicyholders: 1,
            maxPolicyholders: 200
        }));
        console.log("Pool 2 (Stablecoin Depeg Guard):", pool2);

        // Pool 3: Weather Drought Cover
        address pool3 = factory.createPool(InsurancePool.PoolConfig({
            name: "Weather Drought Cover",
            description: "Agricultural drought protection triggered when regional rainfall drops below 50mm.",
            comparison: 0, // LT
            triggerThreshold: 50,
            duration: 30,
            consensusMethod: 0, // byMedian
            verificationCadence: 86400, // daily
            eligibilityAgreementHash: keccak256("drought-eligibility-v1"),
            settlementAgreementHash: keccak256("drought-settlement-v1"),
            eligibilityTldrHash: keccak256("drought-eligibility-tldr-v1"),
            settlementTldrHash: keccak256("drought-settlement-tldr-v1"),
            verificationType: 4, // property
            premiumAmount: 75e6,
            maxPayoutPerPolicy: 10000e6,
            poolEndTimestamp: block.timestamp + 90 days,
            minPolicyholders: 1,
            maxPolicyholders: 50
        }));
        console.log("Pool 3 (Weather Drought Cover):", pool3);

        // Pool 4: Flight Delay Protector
        address pool4 = factory.createPool(InsurancePool.PoolConfig({
            name: "Flight Delay Protector",
            description: "Instant compensation for flight delays exceeding 3 hours.",
            comparison: 1, // GT
            triggerThreshold: 180,
            duration: 1,
            consensusMethod: 1, // byMajority
            verificationCadence: 300, // 5 min
            eligibilityAgreementHash: keccak256("flight-eligibility-v1"),
            settlementAgreementHash: keccak256("flight-settlement-v1"),
            eligibilityTldrHash: keccak256("flight-eligibility-tldr-v1"),
            settlementTldrHash: keccak256("flight-settlement-tldr-v1"),
            verificationType: 2, // flight
            premiumAmount: 15e6,
            maxPayoutPerPolicy: 500e6,
            poolEndTimestamp: block.timestamp + 30 days,
            minPolicyholders: 1,
            maxPolicyholders: 500
        }));
        console.log("Pool 4 (Flight Delay Protector):", pool4);

        // 3. Activate all pools
        factory.activatePool(pool1);
        factory.activatePool(pool2);
        factory.activatePool(pool3);
        factory.activatePool(pool4);
        console.log("All 4 pools activated");

        // 4. Underwrite pool 1 with 100K CZUSD
        czusd.approve(pool1, 100_000e6);
        InsurancePool(pool1).deposit(100_000e6);
        console.log("Deposited 100K CZUSD to pool 1");

        // 5. Purchase policy on pool 1 (Crypto Crash Shield - no verification required)
        czusd.approve(pool1, 50e6);
        InsurancePool(pool1).purchasePolicy();
        console.log("Purchased policy on pool 1");

        vm.stopBroadcast();

        console.log("\n--- Seed Complete ---");
        console.log("CZUSD balance:", czusd.balanceOf(deployer));
    }
}
