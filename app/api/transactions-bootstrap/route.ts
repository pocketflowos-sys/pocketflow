import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type DbProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  preferred_currency: string | null;
  access_status: "pending" | "active" | "blocked" | null;
  paid_at: string | null;
};

type DbUserSettingsRow = {
  profile_name: string | null;
  email: string | null;
  currency: string | null;
  categories: string[] | null;
  payment_methods: string[] | null;
  investment_types: string[] | null;
  investment_platforms: string[] | null;
  asset_categories: string[] | null;
  support_email: string | null;
  theme: "dark" | "light" | null;
};

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const [profileRes, settingsRes, transactionsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, email, preferred_currency, access_status, paid_at")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("user_settings")
        .select(
          "profile_name, email, currency, categories, payment_methods, investment_types, investment_platforms, asset_categories, support_email, theme"
        )
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("transactions")
        .select(
          "id, transaction_date, type, title, category, amount, payment_method, notes, proof_storage_path, proof_file_name, proof_mime_type"
        )
        .eq("user_id", user.id)
        .order("transaction_date", { ascending: false })
    ]);

    const firstError = [profileRes.error, settingsRes.error, transactionsRes.error].find(Boolean);
    if (firstError) {
      return NextResponse.json({ error: firstError.message }, { status: 500 });
    }

    return NextResponse.json({
      profile: (profileRes.data ?? null) as DbProfileRow | null,
      settings: (settingsRes.data ?? null) as DbUserSettingsRow | null,
      transactions: transactionsRes.data ?? []
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load transactions bootstrap." },
      { status: 500 }
    );
  }
}
