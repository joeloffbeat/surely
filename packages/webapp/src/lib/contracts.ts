import InsurancePoolABI from "./abis/InsurancePool.json";
import SurelyFactoryABI from "./abis/SurelyFactory.json";
import PolicyNFTABI from "./abis/PolicyNFT.json";
import CZUSDABI from "./abis/CZUSD.json";
import CZUSDConsumerABI from "./abis/CZUSDConsumer.json";
import CRERouterABI from "./abis/CRERouter.json";
import EligibilityRegistryABI from "./abis/EligibilityRegistry.json";
import ComplianceConsumerABI from "./abis/ComplianceConsumer.json";

// Contract addresses on Avalanche Fuji — update after deployment
export const CONTRACTS = {
  factory: "0x327f771EE67BeD16C7d8C3646c996e09d0e7566e" as `0x${string}`,
  policyNFT: "0xC6D66927f90D072676792EEa0CBbEcA717419f1A" as `0x${string}`,
  czusd: "0xA8D24aDd4E9CE85e6875251a4a0a796BAa2acfCF" as `0x${string}`,
  czusdConsumer: "0xE6D1361B28713eE61d09D0a574F3Dcc7A49aA6F3" as `0x${string}`,
  policyEngine: "0xcF6031722B1F571E3553F9475AFB370CA6c4af7c" as `0x${string}`,
  creRouter: "0xB875b7132aE48fe7b3029C2b74D3E42A5A6A68b4" as `0x${string}`,
  eligibilityRegistry:
    "0x2AC06eA51ae0C56ff2d74441206E081EECAE83fF" as `0x${string}`,
  complianceConsumer:
    "0xF9190C124b9f34d97c5153517FF5c6BD654e0f01" as `0x${string}`,
} as const;

export const ABIS = {
  InsurancePool: InsurancePoolABI,
  SurelyFactory: SurelyFactoryABI,
  PolicyNFT: PolicyNFTABI,
  CZUSD: CZUSDABI,
  CZUSDConsumer: CZUSDConsumerABI,
  CRERouter: CRERouterABI,
  EligibilityRegistry: EligibilityRegistryABI,
  ComplianceConsumer: ComplianceConsumerABI,
} as const;

// Re-export individual ABIs for backwards compatibility
export const INSURANCE_POOL_ABI = InsurancePoolABI;
export const SURELY_FACTORY_ABI = SurelyFactoryABI;
export const POLICY_NFT_ABI = PolicyNFTABI;
export const CZUSD_ABI = CZUSDABI;
export const ELIGIBILITY_REGISTRY_ABI = EligibilityRegistryABI;

// Avalanche Fuji chain ID
export const CHAIN_ID = 43113;
