// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {InsurancePool} from "./InsurancePool.sol";

interface ICRERouterRegistrar {
    function registerPool(address pool) external;
}

interface IPolicyNFTAuthorizer {
    function authorizePool(address pool) external;
}

contract SurelyFactory is Ownable {
    address public czusd;
    address public policyNFT;
    address public policyEngine;
    address public creRouter;
    address public eligibilityRegistry;

    address[] public allPools;
    mapping(address => bool) public isPool;

    event PoolCreated(address indexed pool, address indexed creator, string name);

    constructor(
        address _czusd,
        address _policyNFT,
        address _policyEngine,
        address _creRouter,
        address _eligibilityRegistry
    ) Ownable(msg.sender) {
        czusd = _czusd;
        policyNFT = _policyNFT;
        policyEngine = _policyEngine;
        creRouter = _creRouter;
        eligibilityRegistry = _eligibilityRegistry;
    }

    function createPool(InsurancePool.PoolConfig memory config) external returns (address) {
        InsurancePool pool = new InsurancePool(
            config,
            czusd,
            policyNFT,
            policyEngine,
            eligibilityRegistry,
            creRouter,
            msg.sender
        );

        address poolAddr = address(pool);
        allPools.push(poolAddr);
        isPool[poolAddr] = true;

        // Register with CRERouter
        ICRERouterRegistrar(creRouter).registerPool(poolAddr);

        // Authorize pool on PolicyNFT
        IPolicyNFTAuthorizer(policyNFT).authorizePool(poolAddr);

        emit PoolCreated(poolAddr, msg.sender, config.name);
        return poolAddr;
    }

    function activatePool(address pool) external onlyOwner {
        require(isPool[pool], "SurelyFactory: not a pool");
        InsurancePool(pool).activatePool();
    }

    function pausePool(address pool) external onlyOwner {
        require(isPool[pool], "SurelyFactory: not a pool");
        InsurancePool(pool).pausePool();
    }

    function unpausePool(address pool) external onlyOwner {
        require(isPool[pool], "SurelyFactory: not a pool");
        InsurancePool(pool).unpausePool();
    }

    function getAllPools() external view returns (address[] memory) {
        return allPools;
    }

    function getActivePools() external view returns (address[] memory) {
        uint256 count;
        for (uint256 i = 0; i < allPools.length; i++) {
            if (InsurancePool(allPools[i]).state() == InsurancePool.PoolState.ACTIVE) {
                count++;
            }
        }
        address[] memory active = new address[](count);
        uint256 idx;
        for (uint256 i = 0; i < allPools.length; i++) {
            if (InsurancePool(allPools[i]).state() == InsurancePool.PoolState.ACTIVE) {
                active[idx++] = allPools[i];
            }
        }
        return active;
    }

    function poolCount() external view returns (uint256) {
        return allPools.length;
    }
}
