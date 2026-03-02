import { NextRequest, NextResponse } from "next/server";
import {
  createWalletClient,
  createPublicClient,
  http,
  isAddress,
  decodeEventLog,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { avalancheFuji } from "viem/chains";

const FACTORY_ADDRESS = "0x327f771EE67BeD16C7d8C3646c996e09d0e7566e" as const;

const FACTORY_ABI = [
  {
    type: "function",
    name: "activatePool",
    inputs: [{ name: "pool", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "PoolCreated",
    inputs: [
      {
        name: "pool",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "creator",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      { name: "name", type: "string", indexed: false, internalType: "string" },
    ],
  },
] as const;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      poolAddress?: string;
      txHash?: string;
    };

    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json(
        { error: "Server configuration error: missing private key" },
        { status: 500 },
      );
    }

    const publicClient = createPublicClient({
      chain: avalancheFuji,
      transport: http(),
    });

    let poolAddress = body.poolAddress;

    // If txHash provided, extract pool address from the createPool event logs
    if (!poolAddress && body.txHash) {
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: body.txHash as `0x${string}`,
        confirmations: 1,
      });

      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: FACTORY_ABI,
            data: log.data,
            topics: log.topics,
          });
          if (decoded.eventName === "PoolCreated") {
            poolAddress = decoded.args.pool;
            break;
          }
        } catch {
          // Not a matching event, skip
        }
      }

      if (!poolAddress) {
        return NextResponse.json(
          { error: "Could not find PoolCreated event in transaction" },
          { status: 400 },
        );
      }
    }

    if (!poolAddress || !isAddress(poolAddress)) {
      return NextResponse.json(
        { error: "Invalid or missing pool address" },
        { status: 400 },
      );
    }

    const account = privateKeyToAccount(
      (privateKey.startsWith("0x")
        ? privateKey
        : `0x${privateKey}`) as `0x${string}`,
    );

    const walletClient = createWalletClient({
      account,
      chain: avalancheFuji,
      transport: http(),
    });

    const txHash = await walletClient.writeContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: "activatePool",
      args: [poolAddress as `0x${string}`],
    });

    // Wait for confirmation
    await publicClient.waitForTransactionReceipt({
      hash: txHash,
      confirmations: 1,
    });

    return NextResponse.json({
      success: true,
      txHash,
      poolAddress,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("activate-pool error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
