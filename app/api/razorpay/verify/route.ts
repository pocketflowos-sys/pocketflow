import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { verifyRazorpayPaymentSignature } from "@/lib/razorpay";
import { sendTransactionalEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
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
    const verifiedAt = new Date().toISOString();

    await admin.from("payments").upsert(
      {
        user_id: user.id,
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        currency: "INR",
        status: "paid",
        verified_at: verifiedAt,
        raw_response: body
      },
      { onConflict: "razorpay_order_id" }
    );

    await admin.from("profiles").upsert({
      id: user.id,
      full_name: (user.user_metadata.full_name as string | undefined) ?? "",
      email: user.email ?? "",
      access_status: "active",
      paid_at: verifiedAt
    });

    const { data: profile } = await admin.from("profiles").select("email, full_name").eq("id", user.id).maybeSingle();
    if (profile?.email) {
      try {
        await sendTransactionalEmail({
          to: profile.email,
          subject: "PocketFlow access unlocked",
          html: `<p>Hi ${profile.full_name ?? "there"},</p><p>Your PocketFlow payment has been verified and your access is now active.</p>`
        });
      } catch {}
    }

    return NextResponse.json({ verified: true });
  } catch (error) {
    return NextResponse.json(
      { verified: false, message: error instanceof Error ? error.message : "Payment verification failed." },
      { status: 500 }
    );
  }
}
