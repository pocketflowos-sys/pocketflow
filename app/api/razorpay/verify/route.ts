import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request
    .json()
    .catch(() => ({}));

  const secret = process.env.RAZORPAY_KEY_SECRET;

  if (!secret) {
    return NextResponse.json({
      verified: false,
      demo: true,
      message: "Razorpay secret is missing. Verification is disabled in demo mode."
    });
  }

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json(
      { verified: false, message: "Missing required Razorpay fields." },
      { status: 400 }
    );
  }

  const generated = crypto
    .createHmac("sha256", secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  return NextResponse.json({
    verified: generated === razorpay_signature
  });
}
