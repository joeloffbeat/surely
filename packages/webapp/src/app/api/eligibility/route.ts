import { NextRequest, NextResponse } from "next/server";
import {
  createWalletClient,
  createPublicClient,
  http,
  keccak256,
  encodePacked,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { avalancheFuji } from "viem/chains";

const ELIGIBILITY_REGISTRY_ADDRESS =
  "0x2AC06eA51ae0C56ff2d74441206E081EECAE83fF" as const;

const VERIFICATION_TYPE_MAP: Record<string, number> = {
  none: 0,
  identity: 1,
  flight: 2,
  employment: 3,
  property: 4,
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    userAddress: string;
    verificationType: string;
    verificationData: Record<string, string>;
    poolAddress: string;
  };

  const { userAddress, verificationType, verificationData } = body;

  const verificationTypeNum = VERIFICATION_TYPE_MAP[verificationType] ?? 0;

  // Generate proofHash from verification data
  const proofHash = keccak256(
    encodePacked(
      ["address", "uint8", "string"],
      [
        userAddress as `0x${string}`,
        verificationTypeNum,
        JSON.stringify(verificationData),
      ],
    ),
  );

  // Store proof on-chain if we have a private key
  const privateKey = process.env.PRIVATE_KEY;
  if (privateKey) {
    try {
      const account = privateKeyToAccount(
        (privateKey.startsWith("0x")
          ? privateKey
          : `0x${privateKey}`) as `0x${string}`,
      );

      const walletClient = createWalletClient({
        account,
        chain: avalancheFuji,
        transport: http(
          process.env.NEXT_PUBLIC_AVALANCHE_FUJI_RPC_URL ||
            "https://api.avax-test.network/ext/bc/C/rpc",
        ),
      });

      const publicClient = createPublicClient({
        chain: avalancheFuji,
        transport: http(
          process.env.NEXT_PUBLIC_AVALANCHE_FUJI_RPC_URL ||
            "https://api.avax-test.network/ext/bc/C/rpc",
        ),
      });

      const hash = await walletClient.writeContract({
        address: ELIGIBILITY_REGISTRY_ADDRESS,
        abi: [
          {
            type: "function",
            name: "storeProof",
            inputs: [
              { name: "user", type: "address" },
              { name: "verificationType", type: "uint8" },
              { name: "proofHash", type: "bytes32" },
            ],
            outputs: [],
            stateMutability: "nonpayable",
          },
        ],
        functionName: "storeProof",
        args: [userAddress as `0x${string}`, verificationTypeNum, proofHash],
      });

      // Wait for confirmation
      await publicClient.waitForTransactionReceipt({ hash });

      return NextResponse.json({
        eligible: true,
        proofHash,
        verificationType: body.verificationType,
        poolAddress: body.poolAddress,
        txHash: hash,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Failed to store proof on-chain:", err);
      // Fall through to return proof hash without on-chain storage
    }
  }

  return NextResponse.json({
    eligible: true,
    proofHash,
    verificationType: body.verificationType,
    poolAddress: body.poolAddress,
    timestamp: new Date().toISOString(),
  });
}
