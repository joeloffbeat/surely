"use client";

import { getContract, prepareContractCall } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { useReadContract, useSendTransaction } from "thirdweb/react";
import { thirdwebClient } from "@/lib/thirdweb";
import { CONTRACTS } from "@/lib/contracts";

const avalancheFuji = defineChain(43113);

function getContractInstance(address: string) {
  if (!thirdwebClient) throw new Error("Thirdweb client not initialized");
  return getContract({
    client: thirdwebClient,
    chain: avalancheFuji,
    address,
  });
}

// --- Contract instances ---

export function useFactoryContract() {
  if (!thirdwebClient) return null;
  return getContractInstance(CONTRACTS.factory);
}

export function usePoolContract(poolAddress: string) {
  if (!thirdwebClient || !poolAddress || poolAddress === "0x") return null;
  return getContractInstance(poolAddress);
}

export function usePolicyNFTContract() {
  if (!thirdwebClient) return null;
  return getContractInstance(CONTRACTS.policyNFT);
}

export function useCZUSDContract() {
  if (!thirdwebClient) return null;
  return getContractInstance(CONTRACTS.czusd);
}

// --- Read hooks ---

export function useAllPools() {
  const contract = useFactoryContract();
  return useReadContract({
    contract: contract!,
    method: "function getAllPools() view returns (address[])",
    params: [],
    queryOptions: { enabled: !!contract },
  });
}

export function usePoolName(poolAddress: string) {
  const contract = usePoolContract(poolAddress);
  return useReadContract({
    contract: contract!,
    method: "function name() view returns (string)",
    params: [],
    queryOptions: { enabled: !!contract },
  });
}

export function usePoolDescription(poolAddress: string) {
  const contract = usePoolContract(poolAddress);
  return useReadContract({
    contract: contract!,
    method: "function description() view returns (string)",
    params: [],
    queryOptions: { enabled: !!contract },
  });
}

export function usePoolState(poolAddress: string) {
  const contract = usePoolContract(poolAddress);
  return useReadContract({
    contract: contract!,
    method: "function state() view returns (uint8)",
    params: [],
    queryOptions: { enabled: !!contract },
  });
}

export function usePoolComparison(poolAddress: string) {
  const contract = usePoolContract(poolAddress);
  return useReadContract({
    contract: contract!,
    method: "function comparison() view returns (uint8)",
    params: [],
    queryOptions: { enabled: !!contract },
  });
}

export function usePoolTriggerThreshold(poolAddress: string) {
  const contract = usePoolContract(poolAddress);
  return useReadContract({
    contract: contract!,
    method: "function triggerThreshold() view returns (int256)",
    params: [],
    queryOptions: { enabled: !!contract },
  });
}

export function usePoolVerificationType(poolAddress: string) {
  const contract = usePoolContract(poolAddress);
  return useReadContract({
    contract: contract!,
    method: "function verificationType() view returns (uint8)",
    params: [],
    queryOptions: { enabled: !!contract },
  });
}

export function usePoolConsensusMethod(poolAddress: string) {
  const contract = usePoolContract(poolAddress);
  return useReadContract({
    contract: contract!,
    method: "function consensusMethod() view returns (uint8)",
    params: [],
    queryOptions: { enabled: !!contract },
  });
}

export function usePoolStatus(poolAddress: string) {
  const contract = usePoolContract(poolAddress);
  return useReadContract({
    contract: contract!,
    method:
      "function getPoolStatus() view returns (uint8, uint256, uint256, uint256, uint256, uint256, uint256, uint256)",
    params: [],
    queryOptions: { enabled: !!contract },
  });
}

export function usePoolAgreements(poolAddress: string) {
  const contract = usePoolContract(poolAddress);
  return useReadContract({
    contract: contract!,
    method:
      "function getAgreements() view returns (bytes32, bytes32, bytes32, bytes32)",
    params: [],
    queryOptions: { enabled: !!contract },
  });
}

export function usePoliciesByHolder(holderAddress: string | undefined) {
  const contract = usePolicyNFTContract();
  return useReadContract({
    contract: contract!,
    method:
      "function getPoliciesByHolder(address holder) view returns (uint256[])",
    params: [holderAddress as string],
    queryOptions: { enabled: !!contract && !!holderAddress },
  });
}

export function usePolicyData(tokenId: bigint) {
  const contract = usePolicyNFTContract();
  return useReadContract({
    contract: contract!,
    method:
      "function getPolicyData(uint256 tokenId) view returns ((address pool, address holder, uint256 premium, uint256 coverage, uint256 purchaseTimestamp, uint256 expiryTimestamp, uint8 status, uint256 payoutAmount, bytes32 eligibilityProofHash))",
    params: [tokenId],
    queryOptions: { enabled: !!contract && tokenId > 0n },
  });
}

export function useCZUSDBalance(address: string | undefined) {
  const contract = useCZUSDContract();
  return useReadContract({
    contract: contract!,
    method: "function balanceOf(address account) view returns (uint256)",
    params: [address as string],
    queryOptions: { enabled: !!contract && !!address },
  });
}

// --- Write hooks ---

export function useApproveCZUSD() {
  const { mutateAsync, isPending, data } = useSendTransaction();
  const contract = useCZUSDContract();

  const approve = async (spender: string, amount: bigint) => {
    if (!contract) throw new Error("Contract not ready");
    const tx = prepareContractCall({
      contract,
      method:
        "function approve(address spender, uint256 amount) returns (bool)",
      params: [spender, amount],
    });
    return mutateAsync(tx);
  };

  return { approve, isPending, data };
}

export function usePurchasePolicy(poolAddress: string) {
  const { mutateAsync, isPending, data } = useSendTransaction();
  const contract = usePoolContract(poolAddress);

  const purchase = async () => {
    if (!contract) throw new Error("Contract not ready");
    const tx = prepareContractCall({
      contract,
      method: "function purchasePolicy()",
      params: [],
    });
    return mutateAsync(tx);
  };

  return { purchase, isPending, data };
}

export function useCreatePool() {
  const { mutateAsync, isPending, data } = useSendTransaction();
  const contract = useFactoryContract();

  const createPool = async (config: {
    name: string;
    description: string;
    comparison: number;
    triggerThreshold: bigint;
    duration: bigint;
    consensusMethod: number;
    verificationCadence: bigint;
    eligibilityAgreementHash: string;
    settlementAgreementHash: string;
    eligibilityTldrHash: string;
    settlementTldrHash: string;
    verificationType: number;
    premiumAmount: bigint;
    maxPayoutPerPolicy: bigint;
    poolEndTimestamp: bigint;
    minPolicyholders: bigint;
    maxPolicyholders: bigint;
  }) => {
    if (!contract) throw new Error("Contract not ready");
    const tx = prepareContractCall({
      contract,
      method:
        "function createPool((string name, string description, uint8 comparison, int256 triggerThreshold, uint256 duration, uint8 consensusMethod, uint256 verificationCadence, bytes32 eligibilityAgreementHash, bytes32 settlementAgreementHash, bytes32 eligibilityTldrHash, bytes32 settlementTldrHash, uint8 verificationType, uint256 premiumAmount, uint256 maxPayoutPerPolicy, uint256 poolEndTimestamp, uint256 minPolicyholders, uint256 maxPolicyholders) config) returns (address)",
      params: [config as never],
    });
    return mutateAsync(tx);
  };

  return { createPool, isPending, data };
}

export function useDepositToPool(poolAddress: string) {
  const { mutateAsync, isPending, data } = useSendTransaction();
  const contract = usePoolContract(poolAddress);

  const deposit = async (amount: bigint) => {
    if (!contract) throw new Error("Contract not ready");
    const tx = prepareContractCall({
      contract,
      method: "function deposit(uint256 amount)",
      params: [amount],
    });
    return mutateAsync(tx);
  };

  return { deposit, isPending, data };
}
