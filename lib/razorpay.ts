import crypto from "crypto";

export const pocketFlowPricing = {
  amount: 9900,
  currency: "INR",
  productName: "PocketFlow",
  displayPrice: "₹99"
};

const ORDERS_URL = "https://api.razorpay.com/v1/orders";

function getRazorpayConfig() {
  const keyId = process.env.RAZORPAY_KEY_ID ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("Missing Razorpay credentials.");
  }
  return { keyId, keySecret };
}

export async function createRazorpayOrder({
  amount = pocketFlowPricing.amount,
  currency = pocketFlowPricing.currency,
  receipt,
  notes
}: {
  amount?: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}) {
  const { keyId, keySecret } = getRazorpayConfig();
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const response = await fetch(ORDERS_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ amount, currency, receipt, notes })
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

export function verifyRazorpayPaymentSignature({
  orderId,
  paymentId,
  signature,
  secret = process.env.RAZORPAY_KEY_SECRET
}: {
  orderId: string;
  paymentId: string;
  signature: string;
  secret?: string;
}) {
  if (!secret) {
    throw new Error("Missing Razorpay key secret.");
  }

  const generated = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  return generated === signature;
}

export function verifyWebhookSignature(body: string, signature: string | null, secret = process.env.RAZORPAY_WEBHOOK_SECRET) {
  if (!secret) throw new Error("Missing Razorpay webhook secret.");
  if (!signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return expected === signature;
}
