import { NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { applyRateLimit, getRequestIp } from "@/lib/rate-limit";
import { createRazorpayOrder, pocketFlowPricing } from "@/lib/razorpay";

export async function POST(request: Request) {
  try {
    const ip = getRequestIp(request);
    const rateLimit = applyRateLimit(`create-order:${ip}`, { limit: 10, windowMs: 5 * 60 * 1000 });

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

    const receipt = `pocketflow_${user.id.slice(0, 8)}_${Date.now()}`;
    const order = await createRazorpayOrder({
      amount: pocketFlowPricing.amount,
      currency: pocketFlowPricing.currency,
      receipt,
      notes: { user_id: user.id, product: pocketFlowPricing.productName }
    });

    await admin.from("payments").upsert(
      {
        user_id: user.id,
        razorpay_order_id: order.id,
        amount: pocketFlowPricing.amount / 100,
        currency: pocketFlowPricing.currency,
        status: order.status ?? "created",
        raw_response: order
      },
      { onConflict: "razorpay_order_id" }
    );

    return NextResponse.json(order, {
      headers: {
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create a Razorpay order." },
      { status: 500 }
    );
  }
}
