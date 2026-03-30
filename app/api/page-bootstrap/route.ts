import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type Scope = "lend-borrow" | "credit-cards" | "loans" | "investments" | "assets" | "categories" | "settings" | "budgets";

const SETTINGS_SELECT = "profile_name, email, currency, categories, payment_methods, investment_types, investment_platforms, asset_categories, support_email, theme";
const PROFILE_SELECT = "id, full_name, email, preferred_currency, access_status, paid_at";

function isScope(value: string | null): value is Scope {
  return value === "lend-borrow" || value === "credit-cards" || value === "loans" || value === "investments" || value === "assets" || value === "categories" || value === "settings" || value === "budgets";
}

export async function GET(request: NextRequest) {
  try {
    const scopeParam = request.nextUrl.searchParams.get("scope");
    if (!isScope(scopeParam)) {
      return NextResponse.json({ error: "Invalid scope." }, { status: 400 });
    }

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

    const profileQuery = supabase.from("profiles").select(PROFILE_SELECT).eq("id", user.id).maybeSingle();
    const settingsQuery = supabase.from("user_settings").select(SETTINGS_SELECT).eq("user_id", user.id).maybeSingle();

    if (scopeParam === "lend-borrow") {
      const [profileRes, settingsRes, lendBorrowRes] = await Promise.all([
        profileQuery,
        settingsQuery,
        supabase
          .from("lend_borrow_entries")
          .select("id, entry_date, person_name, type, amount, amount_settled, due_date, notes")
          .eq("user_id", user.id)
          .order("entry_date", { ascending: false })
      ]);

      const firstError = [profileRes.error, settingsRes.error, lendBorrowRes.error].find(Boolean);
      if (firstError) return NextResponse.json({ error: firstError.message }, { status: 500 });

      return NextResponse.json({
        profile: profileRes.data ?? null,
        settings: settingsRes.data ?? null,
        lendBorrowEntries: lendBorrowRes.data ?? []
      });
    }

    if (scopeParam === "credit-cards") {
      const [profileRes, settingsRes, creditCardsRes] = await Promise.all([
        profileQuery,
        settingsQuery,
        supabase
          .from("credit_cards")
          .select("id, card_name, issuer, billing_date, due_date, credit_limit, current_balance, amount_paid, notes")
          .eq("user_id", user.id)
          .order("due_date", { ascending: true })
      ]);

      const firstError = [profileRes.error, settingsRes.error, creditCardsRes.error].find(Boolean);
      if (firstError) return NextResponse.json({ error: firstError.message }, { status: 500 });

      return NextResponse.json({
        profile: profileRes.data ?? null,
        settings: settingsRes.data ?? null,
        creditCards: creditCardsRes.data ?? []
      });
    }

    if (scopeParam === "loans") {
      const [profileRes, settingsRes, loansRes] = await Promise.all([
        profileQuery,
        settingsQuery,
        supabase
          .from("loans")
          .select("id, loan_name, lender, start_date, due_date, principal_amount, outstanding_amount, emi_amount, next_emi_date, interest_rate, notes")
          .eq("user_id", user.id)
          .order("next_emi_date", { ascending: true })
      ]);

      const firstError = [profileRes.error, settingsRes.error, loansRes.error].find(Boolean);
      if (firstError) return NextResponse.json({ error: firstError.message }, { status: 500 });

      return NextResponse.json({
        profile: profileRes.data ?? null,
        settings: settingsRes.data ?? null,
        loans: loansRes.data ?? []
      });
    }

    if (scopeParam === "investments") {
      const [profileRes, settingsRes, investmentsRes] = await Promise.all([
        profileQuery,
        settingsQuery,
        supabase
          .from("investments")
          .select("id, investment_date, investment_type, platform, invested_amount, current_value, withdrawn_amount, notes")
          .eq("user_id", user.id)
          .order("investment_date", { ascending: false })
      ]);

      const firstError = [profileRes.error, settingsRes.error, investmentsRes.error].find(Boolean);
      if (firstError) return NextResponse.json({ error: firstError.message }, { status: 500 });

      return NextResponse.json({
        profile: profileRes.data ?? null,
        settings: settingsRes.data ?? null,
        investments: investmentsRes.data ?? []
      });
    }

    if (scopeParam === "assets") {
      const [profileRes, settingsRes, assetsRes] = await Promise.all([
        profileQuery,
        settingsQuery,
        supabase
          .from("assets")
          .select("id, purchase_date, asset_name, asset_category, purchase_cost, current_value, notes")
          .eq("user_id", user.id)
          .order("purchase_date", { ascending: false })
      ]);

      const firstError = [profileRes.error, settingsRes.error, assetsRes.error].find(Boolean);
      if (firstError) return NextResponse.json({ error: firstError.message }, { status: 500 });

      return NextResponse.json({
        profile: profileRes.data ?? null,
        settings: settingsRes.data ?? null,
        assets: assetsRes.data ?? []
      });
    }

    if (scopeParam === "categories") {
      const [profileRes, settingsRes, transactionsRes, investmentsRes, assetsRes, loansRes] = await Promise.all([
        profileQuery,
        settingsQuery,
        supabase
          .from("transactions")
          .select("id, transaction_date, type, title, category, amount, payment_method, notes, proof_storage_path, proof_file_name, proof_mime_type")
          .eq("user_id", user.id)
          .order("transaction_date", { ascending: false }),
        supabase
          .from("investments")
          .select("id, investment_date, investment_type, platform, invested_amount, current_value, withdrawn_amount, notes")
          .eq("user_id", user.id)
          .order("investment_date", { ascending: false }),
        supabase
          .from("assets")
          .select("id, purchase_date, asset_name, asset_category, purchase_cost, current_value, notes")
          .eq("user_id", user.id)
          .order("purchase_date", { ascending: false }),
        supabase
          .from("loans")
          .select("id, loan_name, lender, start_date, due_date, principal_amount, outstanding_amount, emi_amount, next_emi_date, interest_rate, notes")
          .eq("user_id", user.id)
          .order("next_emi_date", { ascending: true })
      ]);

      const firstError = [profileRes.error, settingsRes.error, transactionsRes.error, investmentsRes.error, assetsRes.error, loansRes.error].find(Boolean);
      if (firstError) return NextResponse.json({ error: firstError.message }, { status: 500 });

      return NextResponse.json({
        profile: profileRes.data ?? null,
        settings: settingsRes.data ?? null,
        transactions: transactionsRes.data ?? [],
        investments: investmentsRes.data ?? [],
        assets: assetsRes.data ?? [],
        loans: loansRes.data ?? []
      });
    }

    if (scopeParam === "budgets") {
      const [profileRes, settingsRes, transactionsRes, budgetsRes] = await Promise.all([
        profileQuery,
        settingsQuery,
        supabase
          .from("transactions")
          .select("id, transaction_date, type, title, category, amount, payment_method, notes, proof_storage_path, proof_file_name, proof_mime_type")
          .eq("user_id", user.id)
          .order("transaction_date", { ascending: false }),
        supabase
          .from("budgets")
          .select("id, month_start, category, budget_amount")
          .eq("user_id", user.id)
          .order("month_start", { ascending: false })
      ]);

      const firstError = [profileRes.error, settingsRes.error, transactionsRes.error, budgetsRes.error].find(Boolean);
      if (firstError) return NextResponse.json({ error: firstError.message }, { status: 500 });

      return NextResponse.json({
        profile: profileRes.data ?? null,
        settings: settingsRes.data ?? null,
        transactions: transactionsRes.data ?? [],
        budgets: budgetsRes.data ?? []
      });
    }

    const [profileRes, settingsRes] = await Promise.all([profileQuery, settingsQuery]);
    const firstError = [profileRes.error, settingsRes.error].find(Boolean);
    if (firstError) return NextResponse.json({ error: firstError.message }, { status: 500 });

    return NextResponse.json({
      profile: profileRes.data ?? null,
      settings: settingsRes.data ?? null
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load scoped page bootstrap." },
      { status: 500 }
    );
  }
}
