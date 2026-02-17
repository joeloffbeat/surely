// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IPolicyEngine} from "./ace/interfaces/IPolicyEngine.sol";

interface IPolicyNFT {
    function mint(
        address holder,
        address pool,
        uint256 premium,
        uint256 coverage,
        uint256 expiryTimestamp,
        bytes32 eligibilityProofHash
    ) external returns (uint256);

    function updateStatus(uint256 tokenId, uint8 status, uint256 payout) external;
}

interface IEligibilityRegistryReader {
    function getProof(address user, uint8 verificationType) external view returns (bytes32);
}

contract InsurancePool {
    enum PoolState { FUNDING, ACTIVE, SETTLED, EXPIRED, PAUSED }
    enum ReportAction { LOG, SETTLEMENT, EXPIRE }

    // Pool metadata
    PoolState public state;
    string public name;
    string public description;
    address public creator;

    // Trigger config
    uint8 public comparison; // 0=LT, 1=GT, 2=LTE, 3=GTE
    int256 public triggerThreshold;
    uint256 public duration; // consecutive ticks required
    uint8 public consensusMethod; // 0=byMedian, 1=byMajority
    uint256 public verificationCadence; // seconds between checks

    // Agreements (hashes)
    bytes32 public eligibilityAgreementHash;
    bytes32 public settlementAgreementHash;
    bytes32 public eligibilityTldrHash;
    bytes32 public settlementTldrHash;

    // Eligibility
    uint8 public verificationType; // 0=none, 1=identity, 2=flight, 3=employment, 4=property

    // Economics (CZUSD)
    uint256 public premiumAmount;
    uint256 public maxPayoutPerPolicy;
    uint256 public poolEndTimestamp;
    uint256 public minPolicyholders;
    uint256 public maxPolicyholders;

    // Participants
    address[] public policyholders;
    mapping(address => uint256) public policyTokenIds;
    mapping(address => uint256) public underwriterDeposits;
    uint256 public totalUnderwritten;
    uint256 public totalPremiums;

    // Integration
    IERC20 public czusd;
    IPolicyNFT public policyNFT;
    IPolicyEngine public policyEngine;
    IEligibilityRegistryReader public eligibilityRegistry;
    address public creRouter;
    address public factory;

    // Events
    event MonitoringTick(int256 value, bool triggered, uint8 consecutiveCount, uint256 timestamp);
    event PolicyPurchased(address indexed holder, uint256 tokenId, uint256 premium);
    event Deposited(address indexed underwriter, uint256 amount);
    event PoolActivated(uint256 timestamp);
    event PoolSettled(uint256 confidence, uint256 totalPayout);
    event PoolExpired(uint256 timestamp);
    event PoolPaused(uint256 timestamp);
    event PoolUnpaused(uint256 timestamp);

    modifier runPolicy() {
        policyEngine.run(msg.data);
        _;
    }

    modifier onlyRouter() {
        require(msg.sender == creRouter, "InsurancePool: not router");
        _;
    }

    modifier onlyFactory() {
        require(msg.sender == factory, "InsurancePool: not factory");
        _;
    }

    modifier inState(PoolState _state) {
        require(state == _state, "InsurancePool: wrong state");
        _;
    }

    struct PoolConfig {
        string name;
        string description;
        uint8 comparison;
        int256 triggerThreshold;
        uint256 duration;
        uint8 consensusMethod;
        uint256 verificationCadence;
        bytes32 eligibilityAgreementHash;
        bytes32 settlementAgreementHash;
        bytes32 eligibilityTldrHash;
        bytes32 settlementTldrHash;
        uint8 verificationType;
        uint256 premiumAmount;
        uint256 maxPayoutPerPolicy;
        uint256 poolEndTimestamp;
        uint256 minPolicyholders;
        uint256 maxPolicyholders;
    }

    constructor(
        PoolConfig memory config,
        address _czusd,
        address _policyNFT,
        address _policyEngine,
        address _eligibilityRegistry,
        address _creRouter,
        address _creator
    ) {
        name = config.name;
        description = config.description;
        comparison = config.comparison;
        triggerThreshold = config.triggerThreshold;
        duration = config.duration;
        consensusMethod = config.consensusMethod;
        verificationCadence = config.verificationCadence;
        eligibilityAgreementHash = config.eligibilityAgreementHash;
        settlementAgreementHash = config.settlementAgreementHash;
        eligibilityTldrHash = config.eligibilityTldrHash;
        settlementTldrHash = config.settlementTldrHash;
        verificationType = config.verificationType;
        premiumAmount = config.premiumAmount;
        maxPayoutPerPolicy = config.maxPayoutPerPolicy;
        poolEndTimestamp = config.poolEndTimestamp;
        minPolicyholders = config.minPolicyholders;
        maxPolicyholders = config.maxPolicyholders;

        czusd = IERC20(_czusd);
        policyNFT = IPolicyNFT(_policyNFT);
        policyEngine = IPolicyEngine(_policyEngine);
        eligibilityRegistry = IEligibilityRegistryReader(_eligibilityRegistry);
        creRouter = _creRouter;
        factory = msg.sender;
        creator = _creator;
        state = PoolState.FUNDING;
    }

    function purchasePolicy() external inState(PoolState.ACTIVE) {
        require(policyholders.length < maxPolicyholders, "InsurancePool: max capacity");
        require(policyTokenIds[msg.sender] == 0, "InsurancePool: already purchased");

        // Check eligibility if required
        bytes32 proofHash = bytes32(0);
        if (verificationType != 0) {
            proofHash = eligibilityRegistry.getProof(msg.sender, verificationType);
            require(proofHash != bytes32(0), "InsurancePool: no eligibility proof");
        }

        // Transfer CZUSD premium
        require(
            czusd.transferFrom(msg.sender, address(this), premiumAmount),
            "InsurancePool: premium transfer failed"
        );
        totalPremiums += premiumAmount;

        // Mint PolicyNFT
        uint256 tokenId = policyNFT.mint(
            msg.sender,
            address(this),
            premiumAmount,
            maxPayoutPerPolicy,
            poolEndTimestamp,
            proofHash
        );

        policyholders.push(msg.sender);
        policyTokenIds[msg.sender] = tokenId;

        emit PolicyPurchased(msg.sender, tokenId, premiumAmount);
    }

    function deposit(uint256 amount) external {
        require(state == PoolState.FUNDING || state == PoolState.ACTIVE, "InsurancePool: wrong state");
        require(
            czusd.transferFrom(msg.sender, address(this), amount),
            "InsurancePool: deposit transfer failed"
        );
        underwriterDeposits[msg.sender] += amount;
        totalUnderwritten += amount;

        emit Deposited(msg.sender, amount);
    }

    function activatePool() external onlyFactory inState(PoolState.FUNDING) {
        state = PoolState.ACTIVE;
        emit PoolActivated(block.timestamp);
    }

    function onReport(bytes calldata report) external onlyRouter {
        (uint8 action, int256 value, uint8 consecutiveCount, uint256 confidence) =
            abi.decode(report, (uint8, int256, uint8, uint256));

        if (action == uint8(ReportAction.LOG)) {
            _logMonitoring(value, consecutiveCount > 0, consecutiveCount);
        } else if (action == uint8(ReportAction.SETTLEMENT)) {
            _processSettlement(confidence);
        } else if (action == uint8(ReportAction.EXPIRE)) {
            _expirePool();
        }
    }

    function pausePool() external onlyFactory inState(PoolState.ACTIVE) {
        state = PoolState.PAUSED;
        emit PoolPaused(block.timestamp);
    }

    function unpausePool() external onlyFactory inState(PoolState.PAUSED) {
        state = PoolState.ACTIVE;
        emit PoolUnpaused(block.timestamp);
    }

    // --- Internal ---

    function _logMonitoring(int256 value, bool triggered, uint8 consecutiveCount) internal {
        emit MonitoringTick(value, triggered, consecutiveCount, block.timestamp);
    }

    function _processSettlement(uint256 confidence) internal inState(PoolState.ACTIVE) {
        require(confidence > 8000, "InsurancePool: confidence too low"); // 80% in basis points

        uint256 totalPayout;
        uint256 payoutPerPolicy = maxPayoutPerPolicy;
        uint256 poolBalance = czusd.balanceOf(address(this));

        // Cap payout to available balance
        if (payoutPerPolicy * policyholders.length > poolBalance) {
            payoutPerPolicy = poolBalance / policyholders.length;
        }

        for (uint256 i = 0; i < policyholders.length; i++) {
            address holder = policyholders[i];
            uint256 tokenId = policyTokenIds[holder];
            czusd.transfer(holder, payoutPerPolicy);
            policyNFT.updateStatus(tokenId, 1, payoutPerPolicy); // 1 = SETTLED
            totalPayout += payoutPerPolicy;
        }

        state = PoolState.SETTLED;
        emit PoolSettled(confidence, totalPayout);
    }

    function _expirePool() internal inState(PoolState.ACTIVE) {
        require(block.timestamp >= poolEndTimestamp, "InsurancePool: not expired");

        // Update all policies to EXPIRED
        for (uint256 i = 0; i < policyholders.length; i++) {
            uint256 tokenId = policyTokenIds[policyholders[i]];
            policyNFT.updateStatus(tokenId, 2, 0); // 2 = EXPIRED
        }

        // Return remaining funds to creator (simplified for hackathon)
        uint256 remaining = czusd.balanceOf(address(this));
        if (remaining > 0) {
            czusd.transfer(creator, remaining);
        }

        state = PoolState.EXPIRED;
        emit PoolExpired(block.timestamp);
    }

    // --- Views ---

    function getPoolStatus() external view returns (
        PoolState _state,
        uint256 _totalUnderwritten,
        uint256 _totalPremiums,
        uint256 _policyholderCount,
        uint256 _maxPolicyholders,
        uint256 _poolEndTimestamp,
        uint256 _premiumAmount,
        uint256 _maxPayoutPerPolicy
    ) {
        return (
            state,
            totalUnderwritten,
            totalPremiums,
            policyholders.length,
            maxPolicyholders,
            poolEndTimestamp,
            premiumAmount,
            maxPayoutPerPolicy
        );
    }

    function getAgreements() external view returns (
        bytes32 _eligibilityAgreementHash,
        bytes32 _settlementAgreementHash,
        bytes32 _eligibilityTldrHash,
        bytes32 _settlementTldrHash
    ) {
        return (
            eligibilityAgreementHash,
            settlementAgreementHash,
            eligibilityTldrHash,
            settlementTldrHash
        );
    }

    function getPolicyholders() external view returns (address[] memory) {
        return policyholders;
    }
}
