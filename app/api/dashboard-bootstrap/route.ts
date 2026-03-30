import { NextResponse } from "next/server";
import { getCreditCardOutstanding, getLoanOutstanding } from "@/lib/finance";
import { getMonthKey, getTodayIso } from "@/lib/formatters";
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

    const todayIso = getTodayIso();
    const today = new Date(todayIso);
    const monthKey = getMonthKey(todayIso);

    const [
      profileRes,
      settingsRes,
      transactionsRes,
      lendBorrowRes,
      investmentsRes,
      assetsRes,
      creditCardsRes,
      loansRes,
      budgetsRes
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, email, preferred_currency, access_status, paid_at")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("user_settings")
        .select("profile_name, email, currency, categories, payment_methods, investment_types, investment_platforms, asset_categories, support_email, theme")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("transactions")
        .select("id, transaction_date, type, title, category, amount")
        .eq("user_id", user.id)
        .order("transaction_date", { ascending: false }),
      supabase
        .from("lend_borrow_entries")
        .select("id, entry_date, person_name, type, amount, amount_settled, due_date")
        .eq("user_id", user.id)
        .order("entry_date", { ascending: false }),
      supabase
        .from("investments")
        .select("investment_date, current_value")
        .eq("user_id", user.id)
        .order("investment_date", { ascending: true }),
      supabase
        .from("assets")
        .select("current_value")
        .eq("user_id", user.id),
      supabase
        .from("credit_cards")
        .select("due_date, credit_limit, current_balance, amount_paid")
        .eq("user_id", user.id)
        .order("due_date", { ascending: true }),
      supabase
        .from("loans")
        .select("start_date, due_date, next_emi_date, outstanding_amount, emi_amount")
        .eq("user_id", user.id)
        .order("next_emi_date", { ascending: true }),
      supabase
        .from("budgets")
        .select("month_start, budget_amount")
        .eq("user_id", user.id)
        .order("month_start", { ascending: false })
    ]);

    const firstError = [
      profileRes.error,
      settingsRes.error,
      transactionsRes.error,
      lendBorrowRes.error,
      investmentsRes.error,
      assetsRes.error,
      creditCardsRes.error,
      loansRes.error,
      budgetsRes.error
    ].find(Boolean);

    if (firstError) {
      return NextResponse.json({ error: firstError.message }, { status: 500 });
    }

    const transactions = (transactionsRes.data ?? []) as Array<{
      id: string;
      transaction_date: string;
      type: "income" | "expense";
      title: string;
      category: string;
      amount: number;
    }>;
    const lendBorrowEntries = (lendBorrowRes.data ?? []) as Array<{
      id: string;
      entry_date: string;
      person_name: string;
      type: "given" | "borrowed";
      amount: number;
      amount_settled: number;
      due_date: string | null;
    }>;
    const investments = (investmentsRes.data ?? []) as Array<{ investment_date: string; current_value: number }>;
    const assets = (assetsRes.data ?? []) as Array<{ current_value: number }>;
    const creditCards = (creditCardsRes.data ?? []) as Array<{
      due_date: string;
      credit_limit: number;
      current_balance: number;
      amount_paid: number;
    }>;
    const loans = (loansRes.data ?? []) as Array<{
      start_date: string;
      due_date: string | null;
      next_emi_date: string | null;
      outstanding_amount: number;
      emi_amount: number;
    }>;
    const budgets = (budgetsRes.data ?? []) as Array<{ month_start: string; budget_amount: number }>;

    const totalIncome = transactions
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const totalExpenses = transactions
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const currentBalance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    const receivables = lendBorrowEntries
      .filter((item) => item.type === "given")
      .reduce((sum, item) => sum + Math.max(Number(item.amount || 0) - Number(item.amount_settled || 0), 0), 0);
    const payables = lendBorrowEntries
      .filter((item) => item.type === "borrowed")
      .reduce((sum, item) => sum + Math.max(Number(item.amount || 0) - Number(item.amount_settled || 0), 0), 0);

    const totalInvestments = investments.reduce((sum, item) => sum + Number(item.current_value || 0), 0);
    const assetsValue = assets.reduce((sum, item) => sum + Number(item.current_value || 0), 0);
    const creditOutstanding = creditCards.reduce(
      (sum, item) => sum + getCreditCardOutstanding(Number(item.current_balance || 0), Number(item.amount_paid || 0)),
      0
    );
    const creditLimitTotal = creditCards.reduce((sum, item) => sum + Number(item.credit_limit || 0), 0);
    const totalLoanOutstanding = loans.reduce((sum, item) => sum + getLoanOutstanding(Number(item.outstanding_amount || 0)), 0);
    const totalEmiAmount = loans.reduce((sum, item) => sum + Number(item.emi_amount || 0), 0);

    const totalBudget = budgets
      .filter((item) => item.month_start.slice(0, 7) === monthKey)
      .reduce((sum, item) => sum + Number(item.budget_amount || 0), 0);
    const currentMonthExpenses = transactions
      .filter((item) => item.type === "expense" && getMonthKey(item.transaction_date) === monthKey)
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const budgetUsed = totalBudget > 0 ? (currentMonthExpenses / totalBudget) * 100 : 0;

    const expenseByCategoryMap = transactions
      .filter((item) => item.type === "expense" && getMonthKey(item.transaction_date) === monthKey)
      .reduce<Record<string, number>>((acc, item) => {
        acc[item.category] = (acc[item.category] ?? 0) + Number(item.amount || 0);
        return acc;
      }, {});

    const expenseByCategory = Object.entries(expenseByCategoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const monthBuckets = new Map<string, { income: number; expense: number }>();
    transactions.forEach((item) => {
      const key = getMonthKey(item.transaction_date);
      const bucket = monthBuckets.get(key) ?? { income: 0, expense: 0 };
      if (item.type === "income") bucket.income += Number(item.amount || 0);
      else bucket.expense += Number(item.amount || 0);
      monthBuckets.set(key, bucket);
    });

    const incomeVsExpense = Array.from(monthBuckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, values]) => ({
        month: new Intl.DateTimeFormat("en-IN", { month: "short" }).format(new Date(`${key}-01`)),
        income: values.income,
        expense: values.expense
      }));

    const investmentGrowth = investments.map((item) => ({
      month: new Intl.DateTimeFormat("en-IN", { month: "short" }).format(new Date(item.investment_date)),
      value: Number(item.current_value || 0)
    }));

    const recentTransactions = transactions.slice(0, 5).map((item) => ({
      id: item.id,
      date: item.transaction_date,
      type: item.type,
      title: item.title,
      category: item.category,
      amount: Number(item.amount || 0),
      paymentMethod: "",
      notes: "",
      dateLabel: new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(new Date(item.transaction_date))
    }));

    const upcomingDueItems = lendBorrowEntries
      .map((item) => {
        const balance = Math.max(Number(item.amount || 0) - Number(item.amount_settled || 0), 0);
        const dueDateValue = item.due_date ? new Date(item.due_date) : new Date(item.entry_date);
        const isOverdue = item.due_date ? new Date(item.due_date) < today && balance > 0 : false;
        return {
          id: item.id,
          date: item.entry_date,
          person: item.person_name,
          type: item.type,
          amount: Number(item.amount || 0),
          amountSettled: Number(item.amount_settled || 0),
          dueDate: item.due_date ?? undefined,
          balance,
          dueSortValue: dueDateValue.getTime(),
          status: (isOverdue ? "Overdue" : balance > 0 ? "Due soon" : "Closed") as "Overdue" | "Due soon" | "Closed"
        };
      })
      .filter((item) => item.balance > 0)
      .sort((a, b) => a.dueSortValue - b.dueSortValue)
      .slice(0, 4);

    const creditOverdueCount = creditCards.filter(
      (item) => new Date(item.due_date) < today && getCreditCardOutstanding(Number(item.current_balance || 0), Number(item.amount_paid || 0)) > 0
    ).length;
    const loanOverdueCount = loans.filter(
      (item) => Boolean(item.next_emi_date && new Date(item.next_emi_date) < today && Number(item.emi_amount || 0) > 0)
    ).length;
    const overdueCount = upcomingDueItems.filter((item) => item.status === "Overdue").length + creditOverdueCount + loanOverdueCount;

    return NextResponse.json({
      profile: (profileRes.data ?? null) as DbProfileRow | null,
      settings: (settingsRes.data ?? null) as DbUserSettingsRow | null,
      dashboard: {
        totalIncome,
        totalExpenses,
        currentBalance,
        savingsRate,
        budgetUsed,
        receivables,
        payables,
        totalInvestments,
        assetsValue,
        creditOutstanding,
        creditLimitTotal,
        totalLoanOutstanding,
        totalEmiAmount,
        expenseByCategory,
        incomeVsExpense,
        investmentGrowth,
        recentTransactions,
        upcomingDueItems,
        overdueCount
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load dashboard bootstrap." },
      { status: 500 }
    );
  }
}
