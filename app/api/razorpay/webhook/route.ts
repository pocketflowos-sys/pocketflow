import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { verifyWebhookSignature } from "@/lib/razorpay";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");
    const isValid = verifyWebhookSignature(rawBody, signature);

    if (!isValid) {
      return NextResponse.json({ ok: false, message: "Invalid webhook signature." }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event as string | undefined;
    const admin = createServiceRoleSupabaseClient();

    if (event === "payment.captured") {
      const payment = payload.payload?.payment?.entity;
      const orderId = payment?.order_id as string | undefined;
      const paymentId = payment?.id as string | undefined;

      if (orderId) {
        const { data: existingPayment } = await admin
          .from("payments")
          .select("user_id")
          .eq("razorpay_order_id", orderId)
          .maybeSingle();

        const userId = existingPayment?.user_id;

        if (userId) {
          const verifiedAt = new Date().toISOString();

          const { error: paymentError } = await admin.from("payments").upsert(
            {
              user_id: userId,
              razorpay_order_id: orderId,
              razorpay_payment_id: paymentId,
              amount: Number(payment.amount ?? 0) / 100,
              currency: payment.currency ?? "INR",
              status: payment.status ?? "captured",
              verified_at: verifiedAt,
              raw_response: payload
            },
            { onConflict: "razorpay_order_id" }
          );

          if (paymentError) throw paymentError;

          const { error: profileError } = await admin.from("profiles").upsert({
            id: userId,
            access_status: "active",
            paid_at: verifiedAt
          });

          if (profileError) throw profileError;
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Webhook handling failed." },
      { status: 500 }
    );
  }
}
