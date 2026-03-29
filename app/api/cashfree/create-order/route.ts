import { NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { applyRateLimit, getRequestIp } from "@/lib/rate-limit";
import { createCashfreeOrder, pocketFlowPricing } from "@/lib/cashfree";

export async function POST(request: Request) {
  try {
    const ip = getRequestIp(request);
    const rateLimit = applyRateLimit(`create-cashfree-order:${ip}`, { limit: 10, windowMs: 5 * 60 * 1000 });

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many order attempts. Please wait a few minutes and try again." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.max(Math.ceil((rateLimit.resetAt - Date.now()) / 1000), 1))
          }
        }
      );
    }

    const supabase = createServerSupabaseClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "You must be logged in before creating an order." }, { status: 401 });
    }

    const admin = createServiceRoleSupabaseClient();
    const { data: existingProfile } = await admin.from("profiles").select("access_status").eq("id", user.id).maybeSingle();

    if (existingProfile?.access_status === "active") {
      return NextResponse.json({ error: "Your PocketFlow access is already active." }, { status: 409 });
    }

    const orderId = `pf_${user.id.slice(0, 8)}_${Date.now()}`;
    const order = await createCashfreeOrder({
      orderId,
      customerId: user.id,
      customerName: (user.user_metadata.full_name as string | undefined) ?? user.email ?? "PocketFlow User",
      customerEmail: user.email,
      amount: pocketFlowPricing.amount,
      currency: pocketFlowPricing.currency,
      orderTags: { user_id: user.id, product: pocketFlowPricing.productName }
    });

    const { error: paymentInsertError } = await admin.from("payments").upsert(
      {
        user_id: user.id,
        provider: "cashfree",
        provider_order_id: order.order_id,
        amount: pocketFlowPricing.amount,
        currency: pocketFlowPricing.currency,
        status: order.order_status ?? "ACTIVE",
        raw_response: order
      },
      { onConflict: "provider_order_id" }
    );

    if (paymentInsertError) {
      throw paymentInsertError;
    }

    return NextResponse.json(
      {
        order_id: order.order_id,
        cf_order_id: order.cf_order_id,
        payment_session_id: order.payment_session_id,
        order_status: order.order_status ?? "ACTIVE",
        amount: pocketFlowPricing.amount,
        currency: pocketFlowPricing.currency
      },
      {
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create a Cashfree order." },
      { status: 500 }
    );
  }
}
