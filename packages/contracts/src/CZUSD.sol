// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract CZUSD is ERC20, Ownable {
    address public consumer;

    modifier onlyConsumer() {
        require(msg.sender == consumer, "CZUSD: not consumer");
        _;
    }

    constructor() ERC20("Surely USD", "CZUSD") Ownable(msg.sender) {}

    function setConsumer(address _consumer) external onlyOwner {
        consumer = _consumer;
    }

    function ownerMint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function mint(address to, uint256 amount) external onlyConsumer {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyConsumer {
        _burn(from, amount);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }
}
