// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {SurelyFactory} from "../src/SurelyFactory.sol";
import {InsurancePool} from "../src/InsurancePool.sol";
import {PolicyNFT} from "../src/PolicyNFT.sol";
import {CZUSD} from "../src/CZUSD.sol";

contract SurelyFactoryTest is Test {
    SurelyFactory public factory;
    PolicyNFT public policyNFT;
    CZUSD public czusd;

    address owner = address(this);
    address alice = address(0x1);
    address bob = address(0x2);

    function setUp() public {
        czusd = new CZUSD();
        policyNFT = new PolicyNFT();
        factory = new SurelyFactory(address(czusd), address(policyNFT));
        policyNFT.transferOwnership(address(factory));
    }

    function test_CreatePool() public {
        string[] memory sources = new string[](1);
        sources[0] = "weather-api";

        address pool = factory.createPool(
            "Flood Insurance",
            "Coverage for flood events",
            1000e18,
            3,
            "rainfall > 200mm",
            sources
        );

        assertTrue(pool != address(0));
    }
}
