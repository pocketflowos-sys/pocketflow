import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { verifyCashfreeWebhookSignature } from "@/lib/cashfree";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-webhook-signature");
    const timestamp = request.headers.get("x-webhook-timestamp");
    const isValid = verifyCashfreeWebhookSignature({ rawBody, signature, timestamp });

    if (!isValid) {
      return NextResponse.json({ ok: false, message: "Invalid webhook signature." }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const type = payload.type as string | undefined;
    const orderId = payload?.data?.order?.order_id as string | undefined;
    const paymentStatus = String(payload?.data?.payment?.payment_status ?? payload?.data?.order?.order_status ?? "").toUpperCase();
    const paymentId = payload?.data?.payment?.cf_payment_id as string | undefined;
    const paymentTime = payload?.data?.payment?.payment_time as string | undefined;
    const amount = Number(payload?.data?.order?.order_amount ?? payload?.data?.payment?.payment_amount ?? 0);
    const currency = payload?.data?.order?.order_currency ?? payload?.data?.payment?.payment_currency ?? "INR";

    if (!orderId) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const admin = createServiceRoleSupabaseClient();
    const { data: existingPayment, error: existingPaymentError } = await admin
      .from("payments")
      .select("user_id")
      .eq("provider_order_id", orderId)
      .maybeSingle();

    if (existingPaymentError) {
      throw existingPaymentError;
    }

    const userId = existingPayment?.user_id;
    if (!userId) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const normalizedStatus = paymentStatus || (type === "PAYMENT_SUCCESS_WEBHOOK" ? "SUCCESS" : type === "PAYMENT_FAILED_WEBHOOK" ? "FAILED" : "PENDING");
    const finalStatus = normalizedStatus === "SUCCESS" ? "PAID" : normalizedStatus;

    const { error: paymentError } = await admin.from("payments").upsert(
      {
        user_id: userId,
        provider: "cashfree",
        provider_order_id: orderId,
        provider_payment_id: paymentId ?? null,
        amount,
        currency,
        status: finalStatus,
        verified_at: finalStatus === "PAID" ? paymentTime ?? new Date().toISOString() : null,
        raw_response: payload
      },
      { onConflict: "provider_order_id" }
    );

    if (paymentError) {
      throw paymentError;
    }

    if (finalStatus === "PAID") {
      const { error: profileError } = await admin.from("profiles").upsert({
        id: userId,
        access_status: "active",
        paid_at: paymentTime ?? new Date().toISOString()
      });

      if (profileError) {
        throw profileError;
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
