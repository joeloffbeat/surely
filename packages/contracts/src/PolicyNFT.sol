// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract PolicyNFT is ERC721, Ownable {
    enum PolicyStatus { ACTIVE, SETTLED, EXPIRED, CANCELLED }

    struct PolicyData {
        address pool;
        address holder;
        uint256 premium;
        uint256 coverage;
        uint256 purchaseTimestamp;
        uint256 expiryTimestamp;
        PolicyStatus status;
        uint256 payoutAmount;
        bytes32 eligibilityProofHash;
    }

    mapping(uint256 => PolicyData) public policies;
    mapping(address => uint256[]) public holderPolicies;
    mapping(address => bool) public authorizedPools;
    uint256 public nextTokenId = 1;

    event PolicyMinted(uint256 indexed tokenId, address indexed holder, address indexed pool);
    event PolicyStatusUpdated(uint256 indexed tokenId, PolicyStatus status, uint256 payout);

    modifier onlyPool() {
        require(authorizedPools[msg.sender], "PolicyNFT: not authorized pool");
        _;
    }

    constructor() ERC721("Surely Policy", "CZPOL") Ownable(msg.sender) {}

    function authorizePool(address pool) external onlyOwner {
        authorizedPools[pool] = true;
    }

    function mint(
        address holder,
        address pool,
        uint256 premium,
        uint256 coverage,
        uint256 expiryTimestamp,
        bytes32 eligibilityProofHash
    ) external onlyPool returns (uint256) {
        uint256 tokenId = nextTokenId++;
        _mint(holder, tokenId);

        policies[tokenId] = PolicyData({
            pool: pool,
            holder: holder,
            premium: premium,
            coverage: coverage,
            purchaseTimestamp: block.timestamp,
            expiryTimestamp: expiryTimestamp,
            status: PolicyStatus.ACTIVE,
            payoutAmount: 0,
            eligibilityProofHash: eligibilityProofHash
        });

        holderPolicies[holder].push(tokenId);
        emit PolicyMinted(tokenId, holder, pool);
        return tokenId;
    }

    function updateStatus(uint256 tokenId, PolicyStatus status, uint256 payout) external onlyPool {
        require(policies[tokenId].pool == msg.sender, "PolicyNFT: wrong pool");
        policies[tokenId].status = status;
        policies[tokenId].payoutAmount = payout;
        emit PolicyStatusUpdated(tokenId, status, payout);
    }

    function getPolicyData(uint256 tokenId) external view returns (PolicyData memory) {
        return policies[tokenId];
    }

    function getPoliciesByHolder(address holder) external view returns (uint256[] memory) {
        return holderPolicies[holder];
    }
}
