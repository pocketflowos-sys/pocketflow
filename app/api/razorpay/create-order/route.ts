import { NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { createRazorpayOrder, pocketFlowPricing } from "@/lib/razorpay";

export async function POST() {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "You must be logged in before creating an order." }, { status: 401 });
    }

    const receipt = `pocketflow_${user.id.slice(0, 8)}_${Date.now()}`;
    const order = await createRazorpayOrder({
      amount: pocketFlowPricing.amount,
      currency: pocketFlowPricing.currency,
      receipt,
      notes: { user_id: user.id, product: pocketFlowPricing.productName }
    });

    const admin = createServiceRoleSupabaseClient();
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

    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create a Razorpay order." },
      { status: 500 }
    );
  }
}
