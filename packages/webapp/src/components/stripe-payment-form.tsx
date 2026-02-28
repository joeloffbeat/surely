"use client";

import { useState, useEffect } from "react";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { getStripe, createPaymentIntent } from "@/lib/stripe";

interface StripePaymentFormProps {
  amountUsd: number;
  userAddress: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (message: string) => void;
}

function CheckoutForm({
  onSuccess,
  onError,
}: {
  onSuccess: (piId: string) => void;
  onError: (msg: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: "if_required",
      });

      if (error) {
        onError(error.message || "Payment failed");
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        onSuccess(paymentIntent.id);
      }
    } catch (err) {
      onError(
        err instanceof Error ? err.message : "Payment confirmation failed",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />
      <button
        type="submit"
        disabled={!stripe || !elements || submitting}
        className="w-full rounded-lg bg-[#635BFF] py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "Processing..." : "Pay Now"}
      </button>
      <p className="text-center text-xs text-dim">
        Test card:{" "}
        <span className="font-mono text-muted-fg">4242 4242 4242 4242</span>{" "}
        &middot; Any future expiry &middot; Any CVC
      </p>
    </form>
  );
}

export default function StripePaymentForm({
  amountUsd,
  userAddress,
  onSuccess,
  onError,
}: StripePaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    createPaymentIntent(amountUsd, userAddress)
      .then(({ clientSecret }) => {
        if (!cancelled) {
          setClientSecret(clientSecret);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          onError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amountUsd, userAddress]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="ml-2 text-sm text-muted-fg">Preparing payment...</span>
      </div>
    );
  }

  if (!clientSecret) return null;

  return (
    <Elements
      stripe={getStripe()}
      options={{
        clientSecret,
        appearance: {
          theme: "night",
          variables: {
            colorPrimary: "#635BFF",
            colorBackground: "#1a1a2e",
            colorText: "#e0e0e0",
            colorDanger: "#ef4444",
            borderRadius: "8px",
            fontFamily: "system-ui, sans-serif",
          },
        },
      }}
    >
      <CheckoutForm onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
}
