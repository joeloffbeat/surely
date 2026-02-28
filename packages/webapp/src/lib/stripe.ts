import { loadStripe, type Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
}

export async function createPaymentIntent(
  amountUsd: number,
  userAddress: string,
): Promise<{ clientSecret: string; paymentIntentId: string }> {
  const res = await fetch("/api/stripe-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amountUsd, userAddress }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to create payment intent");
  }
  return res.json();
}
