"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePocketFlow } from "@/lib/pocketflow-store";
import { pocketFlowPricing } from "@/lib/razorpay";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

async function loadRazorpayScript() {
  if (window.Razorpay) return true;
  return new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function CheckoutPanel() {
  const router = useRouter();
  const { profile, refresh, syncing } = usePocketFlow();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startCheckout() {
    setLoading(true);
    setError("");
    const publicKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!publicKey) {
      setLoading(false);
      return setError("Missing NEXT_PUBLIC_RAZORPAY_KEY_ID in your environment variables.");
    }

    const loaded = await loadRazorpayScript();
    if (!loaded || !window.Razorpay) {
      setLoading(false);
      return setError("Razorpay checkout failed to load. Please try again.");
    }

    const orderResponse = await fetch("/api/razorpay/create-order", { method: "POST" });
    const orderData = await orderResponse.json();

    if (!orderResponse.ok) {
      setLoading(false);
      return setError(orderData.error ?? "Unable to create a payment order.");
    }

    const options = {
      key: publicKey,
      amount: orderData.amount,
      currency: orderData.currency,
      name: pocketFlowPricing.productName,
      description: "PocketFlow lifetime access",
      order_id: orderData.id,
      prefill: {
        name: profile?.fullName ?? "",
        email: profile?.email ?? ""
      },
      theme: { color: "#f4b319" },
      handler: async (response: Record<string, string>) => {
        const verifyResponse = await fetch("/api/razorpay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(response)
        });
        const verifyData = await verifyResponse.json();
        if (!verifyResponse.ok || !verifyData.verified) {
          setLoading(false);
          return setError(verifyData.message ?? "Payment verification failed.");
        }
        await refresh();
        router.replace("/success");
      },
      modal: {
        ondismiss: () => setLoading(false)
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  }

  if (profile?.accessStatus === "active") {
    return (
      <Card className="max-w-xl p-8 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
        <h1 className="mt-6 text-4xl font-semibold">Your access is already active</h1>
        <p className="mt-4 text-lg text-muted">Your PocketFlow account is unlocked. Open the dashboard whenever you are ready.</p>
        <div className="mt-8 flex justify-center">
          <Button onClick={() => router.push("/dashboard")}>Open dashboard</Button>
        </div>
      </Card>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="max-w-2xl p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm text-primary">
          <ShieldCheck className="h-4 w-4" /> One-time payment unlock
        </div>
        <h1 className="mt-6 text-4xl font-semibold">Complete your PocketFlow payment</h1>
        <p className="mt-4 text-lg text-muted">
          You have created your account. Pay once, let Razorpay verify the payment, and your profile will unlock automatically.
        </p>

        <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-2xl font-semibold">PocketFlow lifetime access</p>
              <p className="mt-2 text-sm text-muted">Includes dashboard, budgets, lend/borrow, investments, assets, and settings.</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted line-through">₹1000</p>
              <p className="text-4xl font-semibold text-primary">₹99</p>
            </div>
          </div>
        </div>

        {error ? <div className="mt-6 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div> : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button onClick={() => void startCheckout()} disabled={loading || syncing} className="sm:flex-1">
            {loading || syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Pay ₹99 securely
          </Button>
          <Button variant="secondary" onClick={() => router.push("/login")} className="sm:flex-1">
            Back to login
          </Button>
        </div>
      </Card>
    </main>
  );
}
