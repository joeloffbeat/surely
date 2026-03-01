import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { avalancheFuji } from "viem/chains";
import { stripe } from "@/lib/stripe-server";
import { CONTRACTS } from "@/lib/contracts";
import { parseCZUSD } from "@/lib/czusd";

const CZUSD_MINT_ABI = parseAbi([
  "function ownerMint(address to, uint256 amount) external",
]);

// In production, this webhook would trigger the CRE payment-fiat workflow:
//   POST to CRE gateway → payment-fiat workflow verifies with Stripe →
//   CZUSDConsumer.onReport() → CZUSD.mint()
//
// For hackathon demo, CRE workflows run in simulation mode (not live services),
// so we use ownerMint as a fast path. The CRE payment-fiat workflow is simulated
// separately via `cre workflow simulate payment-fiat --broadcast` to demonstrate
// the full architecture.

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 },
    );
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const userAddress = paymentIntent.metadata.userAddress;
    const czusdAmount = paymentIntent.metadata.czusdAmount;

    if (!userAddress || !czusdAmount) {
      console.error("Missing metadata on PaymentIntent:", paymentIntent.id);
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      console.error("PRIVATE_KEY not configured — cannot mint CZUSD");
      return NextResponse.json(
        { error: "Server not configured for minting" },
        { status: 500 },
      );
    }

    try {
      const formattedKey = privateKey.startsWith("0x")
        ? privateKey
        : `0x${privateKey}`;
      const account = privateKeyToAccount(formattedKey as `0x${string}`);
      const rpcUrl =
        process.env.NEXT_PUBLIC_AVALANCHE_FUJI_RPC_URL ||
        "https://api.avax-test.network/ext/bc/C/rpc";

      const walletClient = createWalletClient({
        account,
        chain: avalancheFuji,
        transport: http(rpcUrl),
      });

      const publicClient = createPublicClient({
        chain: avalancheFuji,
        transport: http(rpcUrl),
      });

      // CZUSD has 6 decimals — matches CRE payment-fiat workflow which uses 10^6
      const mintAmount = parseCZUSD(czusdAmount);

      const txHash = await walletClient.writeContract({
        address: CONTRACTS.czusd,
        abi: CZUSD_MINT_ABI,
        functionName: "ownerMint",
        args: [userAddress as `0x${string}`, mintAmount],
      });

      await publicClient.waitForTransactionReceipt({ hash: txHash });

      console.log(
        `Minted ${czusdAmount} CZUSD to ${userAddress} — tx: ${txHash}`,
      );

      return NextResponse.json({ received: true, txHash });
    } catch (err) {
      console.error("CZUSD mint failed:", err);
      // Return 500 so Stripe retries the webhook
      return NextResponse.json(
        { error: "Mint failed, will retry" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ received: true });
}
