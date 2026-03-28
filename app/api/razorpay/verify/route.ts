import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { applyRateLimit, getRequestIp } from "@/lib/rate-limit";
import { verifyRazorpayPaymentSignature } from "@/lib/razorpay";
import { sendTransactionalEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const ip = getRequestIp(request);
    const rateLimit = applyRateLimit(`verify-payment:${ip}`, { limit: 15, windowMs: 10 * 60 * 1000 });

    if (!rateLimit.success) {
      return NextResponse.json(
        { verified: false, message: "Too many verification attempts. Please wait a few minutes and try again." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.max(Math.ceil((rateLimit.resetAt - Date.now()) / 1000), 1))
          }
        }
      );
    }

    const body = await request.json();
    const orderId = body.razorpay_order_id as string | undefined;
    const paymentId = body.razorpay_payment_id as string | undefined;
    const signature = body.razorpay_signature as string | undefined;

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json({ verified: false, message: "Missing required Razorpay fields." }, { status: 400 });
    }

    const verified = verifyRazorpayPaymentSignature({ orderId, paymentId, signature });
    if (!verified) {
      return NextResponse.json({ verified: false, message: "Signature mismatch." }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ verified: false, message: "Authentication required." }, { status: 401 });
    }

    const admin = createServiceRoleSupabaseClient();
    const { data: paymentRow, error: paymentLookupError } = await admin
      .from("payments")
      .select("id, user_id, status")
      .eq("razorpay_order_id", orderId)
      .maybeSingle();

    if (paymentLookupError) {
      throw paymentLookupError;
    }

    if (!paymentRow) {
      return NextResponse.json({ verified: false, message: "Payment order was not found." }, { status: 404 });
    }

    if (paymentRow.user_id !== user.id) {
      return NextResponse.json({ verified: false, message: "This payment order does not belong to your account." }, { status: 403 });
    }

    const verifiedAt = new Date().toISOString();

    const { error: paymentUpdateError } = await admin
      .from("payments")
      .update({
        razorpay_payment_id: paymentId,
        status: "paid",
        verified_at: verifiedAt,
        raw_response: body
      })
      .eq("razorpay_order_id", orderId)
      .eq("user_id", user.id);

    if (paymentUpdateError) {
      throw paymentUpdateError;
    }

    const { error: profileUpsertError } = await admin.from("profiles").upsert({
      id: user.id,
      full_name: (user.user_metadata.full_name as string | undefined) ?? "",
      email: user.email ?? "",
      access_status: "active",
      paid_at: verifiedAt
    });

    if (profileUpsertError) {
      throw profileUpsertError;
    }

    const { data: profile } = await admin.from("profiles").select("email, full_name").eq("id", user.id).maybeSingle();
    if (profile?.email && paymentRow.status !== "paid") {
      try {
        await sendTransactionalEmail({
          to: profile.email,
          subject: "PocketFlow access unlocked",
          html: `<p>Hi ${profile.full_name ?? "there"},</p><p>Your PocketFlow payment has been verified and your access is now active.</p>`
        });
      } catch {}
    }

    return NextResponse.json(
      { verified: true },
      {
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (error) {
    return NextResponse.json(
      { verified: false, message: error instanceof Error ? error.message : "Payment verification failed." },
      { status: 500 }
    );
  }
}
