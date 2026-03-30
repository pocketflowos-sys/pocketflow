"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoaderScreen } from "@/components/ui/loader-screen";
import { usePocketFlow } from "@/lib/pocketflow-store";
import { pocketFlowPricing } from "@/lib/cashfree";

declare global {
  interface Window {
    Cashfree?: (options: { mode: "sandbox" | "production" }) => {
      checkout: (options: { paymentSessionId: string; redirectTarget?: "_self" | "_blank" | "_top" | "_modal" | HTMLElement }) => Promise<unknown>;
    };
  }
}

async function loadCashfreeScript() {
  if (window.Cashfree) return true;
  return new Promise<boolean>((resolve) => {
    const existing = document.querySelector('script[data-cashfree-sdk="true"]') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    script.dataset.cashfreeSdk = "true";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function getCashfreeMode(): "sandbox" | "production" {
  const env = (process.env.NEXT_PUBLIC_CASHFREE_ENV ?? "").trim().toLowerCase();
  if (env === "sandbox" || env === "test") return "sandbox";
  if (env === "production" || env === "live") return "production";
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "sandbox" : "production";
}

async function wait(ms: number) { return new Promise((resolve) => window.setTimeout(resolve, ms)); }

export function CheckoutPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, refresh, syncing } = usePocketFlow();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (profile?.accessStatus !== "active") return;
    setLoading(false);
    setVerifying(false);
    setRedirecting(true);
    const timeout = window.setTimeout(() => { router.replace("/dashboard"); }, 1400);
    return () => window.clearTimeout(timeout);
  }, [profile?.accessStatus, router]);

  useEffect(() => {
    const orderId = searchParams.get("order_id");
    if (!orderId || profile?.accessStatus === "active") return;
    void verifyOrder(orderId, { retries: 2, silentPending: true });
  }, [profile?.accessStatus, searchParams]);

  async function verifyOrder(orderId: string, options?: { retries?: number; silentPending?: boolean }) {
    setVerifying(true);
    setStatusMessage("Checking your latest payment status...");
    const retries = options?.retries ?? 5;
    let lastMessage = "We could not confirm the payment yet.";

    for (let attempt = 0; attempt < retries; attempt += 1) {
      const verifyResponse = await fetch("/api/cashfree/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order_id: orderId }) });
      const verifyData = await verifyResponse.json().catch(() => ({}));
      if (verifyResponse.ok && verifyData.verified) {
        await refresh();
        setVerifying(false);
        setLoading(false);
        setError("");
        setStatusMessage("");
        router.replace("/dashboard");
        return true;
      }
      lastMessage = verifyData.message ?? lastMessage;
      const status = String(verifyData.status ?? "").toUpperCase();
      if (status && status !== "ACTIVE") break;
      if (attempt < retries - 1) {
        setStatusMessage(`Payment received. Confirming with Cashfree${attempt > 0 ? ` (${attempt + 1}/${retries})` : ""}...`);
        await wait(1800);
      }
    }

    setVerifying(false);
    setLoading(false);
    setStatusMessage("");
    if (!options?.silentPending) setError(lastMessage);
    return false;
  }

  async function startCheckout() {
    setLoading(true);
    setVerifying(false);
    setRedirecting(false);
    setError("");
    setStatusMessage("");

    const loaded = await loadCashfreeScript();
    if (!loaded || !window.Cashfree) {
      setLoading(false);
      return setError("Cashfree checkout failed to load. Please try again.");
    }

    const orderResponse = await fetch("/api/cashfree/create-order", { method: "POST" });
    const orderData = await orderResponse.json().catch(() => ({}));

    if (!orderResponse.ok) {
      setLoading(false);
      return setError(orderData.error ?? "Unable to create a payment order.");
    }

    const cashfree = window.Cashfree({ mode: getCashfreeMode() });

    try {
      setStatusMessage("Opening Cashfree secure checkout...");
      await cashfree.checkout({ paymentSessionId: orderData.payment_session_id, redirectTarget: "_modal" });
    } catch (checkoutError) {
      const message = checkoutError instanceof Error ? checkoutError.message : "The checkout window was closed before payment completed.";
      setError(message);
    }

    await verifyOrder(orderData.order_id, { retries: 6 });
  }

  if (verifying) return <LoaderScreen title="Verifying your payment" message={statusMessage || "Please stay on this screen while we confirm your payment and unlock your access."} />;

  if (profile?.accessStatus === "active") {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-12"><Card className="w-full max-w-xl p-8 text-center"><CheckCircle2 className="mx-auto h-14 w-14 text-success" /><h1 className="mt-6 text-4xl font-semibold">Your access is already active</h1><p className="mt-4 text-lg text-muted">Your PocketFlow account is unlocked. We are taking you to the dashboard now.</p><div className="mt-6 flex items-center justify-center gap-2 text-primary"><Loader2 className="h-4 w-4 animate-spin" /><span className="text-sm">Opening your dashboard...</span></div><div className="mt-8 flex justify-center"><Button onClick={() => router.push("/dashboard")}>{redirecting ? "Open now" : "Open dashboard"}</Button></div></Card></main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-2xl p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm text-primary"><ShieldCheck className="h-4 w-4" />One-time payment unlock</div>
        <h1 className="mt-6 text-4xl font-semibold">Complete your PocketFlow payment</h1>
        <p className="mt-4 text-lg text-muted">You have created your account. Pay once through Cashfree and your profile will unlock automatically after payment confirmation.</p>

        <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-2xl font-semibold">PocketFlow lifetime access</p>
              <p className="mt-2 text-sm text-muted">Current buyer offer: dashboard, budgets, lend/borrow, cards, loans, investments, assets, settings, and category view.</p>
              <p className="mt-2 text-sm text-muted">Future pricing for new users may change later.</p>
            </div>
            <div className="text-right"><p className="text-sm text-muted line-through">₹1000</p><p className="text-4xl font-semibold text-primary">{pocketFlowPricing.displayPrice}</p></div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-muted">No refund after payment because access is delivered instantly after verification. If promised service or access is not provided properly, contact support.</div>
        {error ? <div className="mt-6 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div> : null}
        {statusMessage && loading ? <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">{statusMessage}</div> : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap"><Button onClick={() => void startCheckout()} disabled={loading || syncing} className="sm:flex-1">{loading || syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{loading ? "Preparing payment..." : `Pay ${pocketFlowPricing.displayPrice} securely`}</Button><Button variant="secondary" onClick={() => router.push("/login")} className="sm:flex-1" disabled={loading || syncing}>Back to login</Button>{loading ? <p className="text-sm text-primary">Opening Cashfree secure checkout...</p> : null}</div>
      </Card>
    </main>
  );
}
