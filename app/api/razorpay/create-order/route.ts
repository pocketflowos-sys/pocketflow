import { NextRequest, NextResponse } from "next/server";

const RAZORPAY_ORDERS_URL = "https://api.razorpay.com/v1/orders";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const amount = typeof body.amount === "number" ? body.amount : 9900;
  const currency = typeof body.currency === "string" ? body.currency : "INR";

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return NextResponse.json({
      demo: true,
      amount,
      currency,
      message: "Razorpay keys are missing. Add them to enable live order creation."
    });
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const response = await fetch(RAZORPAY_ORDERS_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      amount,
      currency,
      receipt: `pocketflow_${Date.now()}`
    })
  });

  if (!response.ok) {
    const error = await response.text();
    return NextResponse.json(
      { error: "Failed to create Razorpay order", details: error },
      { status: 500 }
    );
  }

  const data = await response.json();
  return NextResponse.json(data);
}
