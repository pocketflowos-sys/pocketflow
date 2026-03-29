import crypto from "crypto";
import { getBaseUrl } from "@/lib/app-url";

export const pocketFlowPricing = {
  amount: 99,
  currency: "INR",
  productName: "PocketFlow",
  displayPrice: "₹99"
};

type CashfreeEnvironment = "sandbox" | "production";

type CashfreeConfig = {
  clientId: string;
  secretKey: string;
  environment: CashfreeEnvironment;
  apiBaseUrl: string;
  apiVersion: string;
};

function resolveEnvironment(): CashfreeEnvironment {
  const raw = (process.env.CASHFREE_ENV ?? process.env.NEXT_PUBLIC_CASHFREE_ENV ?? "").trim().toLowerCase();
  if (raw === "sandbox" || raw === "test") return "sandbox";
  if (raw === "production" || raw === "live") return "production";
  return process.env.NODE_ENV === "production" ? "production" : "sandbox";
}

function getCashfreeConfig(): CashfreeConfig {
  const clientId = process.env.CASHFREE_CLIENT_ID ?? process.env.NEXT_PUBLIC_CASHFREE_CLIENT_ID;
  const secretKey = process.env.CASHFREE_CLIENT_SECRET;

  if (!clientId || !secretKey) {
    throw new Error("Missing Cashfree credentials.");
  }

  const environment = resolveEnvironment();

  return {
    clientId,
    secretKey,
    environment,
    apiBaseUrl: environment === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg",
    apiVersion: process.env.CASHFREE_API_VERSION ?? "2025-01-01"
  };
}

function buildCashfreeHeaders(extra?: Record<string, string>) {
  const { clientId, secretKey, apiVersion } = getCashfreeConfig();

  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-client-id": clientId,
    "x-client-secret": secretKey,
    "x-api-version": apiVersion,
    ...extra
  };
}

export function getCashfreeClientMode() {
  return resolveEnvironment();
}

export async function createCashfreeOrder({
  orderId,
  customerId,
  customerName,
  customerEmail,
  customerPhone = "9999999999",
  amount = pocketFlowPricing.amount,
  currency = pocketFlowPricing.currency,
  orderTags
}: {
  orderId: string;
  customerId: string;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  amount?: number;
  currency?: string;
  orderTags?: Record<string, string>;
}) {
  const { apiBaseUrl } = getCashfreeConfig();

  const response = await fetch(`${apiBaseUrl}/orders`, {
    method: "POST",
    headers: buildCashfreeHeaders({
      "x-idempotency-key": crypto.randomUUID(),
      "x-request-id": crypto.randomUUID()
    }),
    body: JSON.stringify({
      order_id: orderId,
      order_amount: amount,
      order_currency: currency,
      customer_details: {
        customer_id: customerId,
        customer_name: customerName ?? "PocketFlow User",
        customer_email: customerEmail ?? undefined,
        customer_phone: customerPhone ?? "9999999999"
      },
      order_meta: {
        return_url: `${getBaseUrl()}/checkout?order_id=${encodeURIComponent(orderId)}`
      },
      order_tags: orderTags ?? undefined,
      order_note: `${pocketFlowPricing.productName} lifetime access`
    })
  });

  const payload = await response.json().catch(async () => ({ message: await response.text() }));

  if (!response.ok) {
    throw new Error(
      payload?.message || payload?.type || payload?.error || "Failed to create a Cashfree order."
    );
  }

  return payload as {
    order_id: string;
    cf_order_id?: string;
    payment_session_id: string;
    order_status?: string;
    order_amount?: number;
    order_currency?: string;
  };
}

export async function fetchCashfreeOrder(orderId: string) {
  const { apiBaseUrl } = getCashfreeConfig();
  const response = await fetch(`${apiBaseUrl}/orders/${encodeURIComponent(orderId)}`, {
    method: "GET",
    headers: buildCashfreeHeaders({
      "x-request-id": crypto.randomUUID()
    }),
    cache: "no-store"
  });

  const payload = await response.json().catch(async () => ({ message: await response.text() }));

  if (!response.ok) {
    throw new Error(payload?.message || payload?.type || payload?.error || "Failed to fetch the Cashfree order.");
  }

  return payload as {
    order_id: string;
    cf_order_id?: string;
    order_status?: string;
    order_amount?: number;
    order_currency?: string;
    payment_session_id?: string;
  };
}

export function verifyCashfreeWebhookSignature({
  rawBody,
  timestamp,
  signature,
  secret = process.env.CASHFREE_WEBHOOK_SECRET ?? process.env.CASHFREE_CLIENT_SECRET
}: {
  rawBody: string;
  timestamp: string | null;
  signature: string | null;
  secret?: string;
}) {
  if (!secret) throw new Error("Missing Cashfree webhook secret.");
  if (!timestamp || !signature) return false;

  const signedPayload = `${timestamp}${rawBody}`;
  const expected = crypto.createHmac("sha256", secret).update(signedPayload).digest("base64");
  return expected === signature;
}
