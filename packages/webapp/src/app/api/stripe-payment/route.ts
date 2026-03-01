import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe-server";

export async function POST(request: NextRequest) {
  const { amountUsd, userAddress } = (await request.json()) as {
    amountUsd: number;
    userAddress: string;
  };

  if (!amountUsd || !userAddress) {
    return NextResponse.json(
      { error: "Missing amountUsd or userAddress" },
      { status: 400 },
    );
  }

  if (amountUsd < 1 || amountUsd > 10000) {
    return NextResponse.json(
      { error: "Amount must be between $1 and $10,000" },
      { status: 400 },
    );
  }

  try {
    const amountCents = Math.round(amountUsd * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      metadata: {
        userAddress,
        czusdAmount: amountUsd.toString(),
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err) {
    console.error("Stripe PaymentIntent creation failed:", err);
    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 },
    );
  }
}
