"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import type { User } from "@supabase/supabase-js";
import { emptyPocketFlowState, emptyUserSettings } from "@/lib/defaults";
import { getMonthKey, getTodayIso } from "@/lib/formatters";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type {
  Asset,
  Budget,
  Investment,
  LendBorrowEntry,
  PocketFlowContextValue,
  PocketFlowState,
  Profile,
  Transaction,
  UserSettings
} from "@/lib/types";

const PocketFlowContext = createContext<PocketFlowContextValue | null>(null);

type DbTransactionRow = {
  id: string;
  transaction_date: string;
  type: Transaction["type"];
  title: string;
  category: string;
  amount: number;
  payment_method: string;
  notes: string | null;
};

type DbLendBorrowRow = {
  id: string;
  entry_date: string;
  person_name: string;
  type: LendBorrowEntry["type"];
  amount: number;
  amount_settled: number;
  due_date: string | null;
  notes: string | null;
};

type DbInvestmentRow = {
  id: string;
  investment_date: string;
  investment_type: string;
  platform: string;
  invested_amount: number;
  current_value: number;
  withdrawn_amount: number;
  notes: string | null;
};

type DbAssetRow = {
  id: string;
  purchase_date: string | null;
  asset_name: string;
  asset_category: string;
  purchase_cost: number;
  current_value: number;
  notes: string | null;
};

type DbBudgetRow = {
  id: string;
  month_start: string;
  category: string;
  budget_amount: number;
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
};

type DbProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  preferred_currency: string | null;
  access_status: Profile["accessStatus"] | null;
  paid_at: string | null;
};

function normalizeNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function mapTransaction(row: DbTransactionRow): Transaction {
  return {
    id: row.id,
    date: row.transaction_date,
    type: row.type,
    title: row.title,
    category: row.category,
    amount: normalizeNumber(row.amount),
    paymentMethod: row.payment_method,
    notes: row.notes ?? ""
  };
}

function mapLendBorrow(row: DbLendBorrowRow): LendBorrowEntry {
  return {
    id: row.id,
    date: row.entry_date,
    person: row.person_name,
    type: row.type,
    amount: normalizeNumber(row.amount),
    amountSettled: normalizeNumber(row.amount_settled),
    dueDate: row.due_date ?? undefined,
    notes: row.notes ?? ""
  };
}

function mapInvestment(row: DbInvestmentRow): Investment {
  return {
    id: row.id,
    date: row.investment_date,
    investmentType: row.investment_type,
    platform: row.platform,
    investedAmount: normalizeNumber(row.invested_amount),
    currentValue: normalizeNumber(row.current_value),
    withdrawnAmount: normalizeNumber(row.withdrawn_amount),
    notes: row.notes ?? ""
  };
}

function mapAsset(row: DbAssetRow): Asset {
  return {
    id: row.id,
    date: row.purchase_date ?? getTodayIso(),
    assetName: row.asset_name,
    assetCategory: row.asset_category,
    purchaseCost: normalizeNumber(row.purchase_cost),
    currentValue: normalizeNumber(row.current_value),
    notes: row.notes ?? ""
  };
}

function mapBudget(row: DbBudgetRow): Budget {
  return {
    id: row.id,
    month: row.month_start.slice(0, 7),
    category: row.category,
    amount: normalizeNumber(row.budget_amount)
  };
}

function mapSettings(row: DbUserSettingsRow | null, profile: Profile | null, fallbackEmail = ""): UserSettings {
  return {
    profileName: row?.profile_name ?? profile?.fullName ?? "",
    email: row?.email ?? profile?.email ?? fallbackEmail,
    currency: row?.currency ?? profile?.preferredCurrency ?? "INR",
    categories: row?.categories?.length ? row.categories : emptyUserSettings.categories,
    paymentMethods: row?.payment_methods?.length ? row.payment_methods : emptyUserSettings.paymentMethods,
    investmentTypes: row?.investment_types?.length ? row.investment_types : emptyUserSettings.investmentTypes,
    investmentPlatforms: row?.investment_platforms?.length
      ? row.investment_platforms
      : emptyUserSettings.investmentPlatforms,
    assetCategories: row?.asset_categories?.length ? row.asset_categories : emptyUserSettings.assetCategories,
    supportEmail: row?.support_email ?? emptyUserSettings.supportEmail
  };
}

function mapProfile(row: DbProfileRow | null, user: User | null): Profile | null {
  if (!user) return null;
  return {
    id: user.id,
    fullName: row?.full_name ?? (user.user_metadata.full_name as string | undefined) ?? "",
    email: row?.email ?? user.email ?? "",
    preferredCurrency: row?.preferred_currency ?? "INR",
    accessStatus: row?.access_status ?? "pending",
    paidAt: row?.paid_at ?? null
  };
}

async function ensureSettingsRow(user: User) {
  const supabase = createBrowserSupabaseClient();
  await supabase.from("user_settings").upsert(
    {
      user_id: user.id,
      profile_name: (user.user_metadata.full_name as string | undefined) ?? emptyUserSettings.profileName,
      email: user.email ?? emptyUserSettings.email,
      currency: emptyUserSettings.currency,
      categories: emptyUserSettings.categories,
      payment_methods: emptyUserSettings.paymentMethods,
      investment_types: emptyUserSettings.investmentTypes,
      investment_platforms: emptyUserSettings.investmentPlatforms,
      asset_categories: emptyUserSettings.assetCategories,
      support_email: emptyUserSettings.supportEmail
    },
    { onConflict: "user_id", ignoreDuplicates: true }
  );
}

export function PocketFlowProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PocketFlowState>(emptyPocketFlowState);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [operationError, setOperationError] = useState("");

  const configured = isSupabaseConfigured();

  const clearOperationError = useCallback(() => setOperationError(""), []);

  const resetLocalState = useCallback(() => {
    setState(emptyPocketFlowState);
    setProfile(null);
    setOperationError("");
  }, []);

  const refresh = useCallback(async () => {
    if (!configured) {
      setLoading(false);
      setOperationError("Supabase env variables are missing. Add them in Vercel and .env.local.");
      return;
    }

    const supabase = createBrowserSupabaseClient();
    setSyncing(true);
    setOperationError("");

    try {
      const {
        data: { user: currentUser },
        error: userError
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      setUser(currentUser);

      if (!currentUser) {
        resetLocalState();
        return;
      }

      await ensureSettingsRow(currentUser);

      const [profileRes, settingsRes, transactionsRes, lendBorrowRes, investmentsRes, assetsRes, budgetsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, email, preferred_currency, access_status, paid_at")
          .eq("id", currentUser.id)
          .maybeSingle(),
        supabase
          .from("user_settings")
          .select(
            "profile_name, email, currency, categories, payment_methods, investment_types, investment_platforms, asset_categories, support_email"
          )
          .eq("user_id", currentUser.id)
          .maybeSingle(),
        supabase
          .from("transactions")
          .select("id, transaction_date, type, title, category, amount, payment_method, notes")
          .order("transaction_date", { ascending: false }),
        supabase
          .from("lend_borrow_entries")
          .select("id, entry_date, person_name, type, amount, amount_settled, due_date, notes")
          .order("entry_date", { ascending: false }),
        supabase
          .from("investments")
          .select("id, investment_date, investment_type, platform, invested_amount, current_value, withdrawn_amount, notes")
          .order("investment_date", { ascending: false }),
        supabase
          .from("assets")
          .select("id, purchase_date, asset_name, asset_category, purchase_cost, current_value, notes")
          .order("purchase_date", { ascending: false }),
        supabase
          .from("budgets")
          .select("id, month_start, category, budget_amount")
          .order("month_start", { ascending: false })
      ]);

      const firstError = [profileRes.error, settingsRes.error, transactionsRes.error, lendBorrowRes.error, investmentsRes.error, assetsRes.error, budgetsRes.error].find(Boolean);
      if (firstError) throw firstError;

      const nextProfile = mapProfile((profileRes.data ?? null) as DbProfileRow | null, currentUser);
      setProfile(nextProfile);
      setState({
        transactions: (transactionsRes.data ?? []).map((row) => mapTransaction(row as DbTransactionRow)),
        lendBorrowEntries: (lendBorrowRes.data ?? []).map((row) => mapLendBorrow(row as DbLendBorrowRow)),
        investments: (investmentsRes.data ?? []).map((row) => mapInvestment(row as DbInvestmentRow)),
        assets: (assetsRes.data ?? []).map((row) => mapAsset(row as DbAssetRow)),
        budgets: (budgetsRes.data ?? []).map((row) => mapBudget(row as DbBudgetRow)),
        userSettings: mapSettings((settingsRes.data ?? null) as DbUserSettingsRow | null, nextProfile, currentUser.email ?? "")
      });
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : "Failed to sync your PocketFlow data.");
    } finally {
      setSyncing(false);
      setLoading(false);
    }
  }, [configured, resetLocalState]);

  useEffect(() => {
    let active = true;
    if (!configured) {
      setLoading(false);
      setOperationError("Supabase env variables are missing. Add them in Vercel and .env.local.");
      return;
    }

    const supabase = createBrowserSupabaseClient();

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user ?? null);
    });

    refresh();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      refresh();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [configured, refresh]);

  const runMutation = useCallback(async <T,>(callback: () => Promise<T>) => {
    setSyncing(true);
    setOperationError("");
    try {
      await callback();
      return true;
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : "Something went wrong.");
      return false;
    } finally {
      setSyncing(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!configured) return;
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    resetLocalState();
    setUser(null);
  }, [configured, resetLocalState]);

  const value = useMemo<PocketFlowContextValue>(() => {
    const addTransaction = async (input: Omit<Transaction, "id">) => {
      if (!user) return false;
      return runMutation(async () => {
        const supabase = createBrowserSupabaseClient();
        const { data, error } = await supabase
          .from("transactions")
          .insert({
            user_id: user.id,
            transaction_date: input.date,
            type: input.type,
            title: input.title,
            category: input.category,
            amount: input.amount,
            payment_method: input.paymentMethod,
            notes: input.notes ?? null
          })
          .select("id, transaction_date, type, title, category, amount, payment_method, notes")
          .single();
        if (error) throw error;
        setState((prev) => ({ ...prev, transactions: [mapTransaction(data as DbTransactionRow), ...prev.transactions] }));
      });
    };

    const updateTransaction = async (id: string, input: Omit<Transaction, "id">) => {
      if (!user) return false;
      return runMutation(async () => {
        const supabase = createBrowserSupabaseClient();
        const { data, error } = await supabase
          .from("transactions")
          .update({
            transaction_date: input.date,
            type: input.type,
            title: input.title,
            category: input.category,
            amount: input.amount,
            payment_method: input.paymentMethod,
            notes: input.notes ?? null
          })
          .eq("id", id)
          .eq("user_id", user.id)
          .select("id, transaction_date, type, title, category, amount, payment_method, notes")
          .single();
        if (error) throw error;
        setState((prev) => ({
          ...prev,
          transactions: prev.transactions.map((item) => (item.id === id ? mapTransaction(data as DbTransactionRow) : item))
        }));
      });
    };

    const deleteTransaction = async (id: string) => {
      if (!user) return false;
      return runMutation(async () => {
        const supabase = createBrowserSupabaseClient();
        const { error } = await supabase.from("transactions").delete().eq("id", id).eq("user_id", user.id);
        if (error) throw error;
        setState((prev) => ({ ...prev, transactions: prev.transactions.filter((item) => item.id !== id) }));
      });
    };

    const addLendBorrowEntry = async (input: Omit<LendBorrowEntry, "id">) => {
      if (!user) return false;
      return runMutation(async () => {
        const supabase = createBrowserSupabaseClient();
        const { data, error } = await supabase
          .from("lend_borrow_entries")
          .insert({
            user_id: user.id,
            entry_date: input.date,
            person_name: input.person,
            type: input.type,
            amount: input.amount,
            amount_settled: input.amountSettled,
            due_date: input.dueDate ?? null,
            notes: input.notes ?? null
          })
          .select("id, entry_date, person_name, type, amount, amount_settled, due_date, notes")
          .single();
        if (error) throw error;
        setState((prev) => ({
          ...prev,
          lendBorrowEntries: [mapLendBorrow(data as DbLendBorrowRow), ...prev.lendBorrowEntries]
        }));
      });
    };

    const updateLendBorrowEntry = async (id: string, input: Omit<LendBorrowEntry, "id">) => {
      if (!user) return false;
      return runMutation(async () => {
        const supabase = createBrowserSupabaseClient();
        const { data, error } = await supabase
          .from("lend_borrow_entries")
          .update({
            entry_date: input.date,
            person_name: input.person,
            type: input.type,
            amount: input.amount,
            amount_settled: input.amountSettled,
            due_date: input.dueDate ?? null,
            notes: input.notes ?? null
          })
          .eq("id", id)
          .eq("user_id", user.id)
          .select("id, entry_date, person_name, type, amount, amount_settled, due_date, notes")
          .single();
        if (error) throw error;
        setState((prev) => ({
          ...prev,
          lendBorrowEntries: prev.lendBorrowEntries.map((item) => (item.id === id ? mapLendBorrow(data as DbLendBorrowRow) : item))
        }));
      });
    };

    const deleteLendBorrowEntry = async (id: string) => {
      if (!user) return false;
      return runMutation(async () => {
        const supabase = createBrowserSupabaseClient();
        const { error } = await supabase.from("lend_borrow_entries").delete().eq("id", id).eq("user_id", user.id);
        if (error) throw error;
        setState((prev) => ({ ...prev, lendBorrowEntries: prev.lendBorrowEntries.filter((item) => item.id !== id) }));
      });
    };

    const addInvestment = async (input: Omit<Investment, "id">) => {
      if (!user) return false;
      return runMutation(async () => {
        const supabase = createBrowserSupabaseClient();
        const { data, error } = await supabase
          .from("investments")
          .insert({
            user_id: user.id,
            investment_date: input.date,
            investment_type: input.investmentType,
            platform: input.platform,
            invested_amount: input.investedAmount,
            current_value: input.currentValue,
            withdrawn_amount: input.withdrawnAmount,
            notes: input.notes ?? null
          })
          .select("id, investment_date, investment_type, platform, invested_amount, current_value, withdrawn_amount, notes")
          .single();
        if (error) throw error;
        setState((prev) => ({ ...prev, investments: [mapInvestment(data as DbInvestmentRow), ...prev.investments] }));
      });
    };

    const updateInvestment = async (id: string, input: Omit<Investment, "id">) => {
      if (!user) return false;
      return runMutation(async () => {
        const supabase = createBrowserSupabaseClient();
        const { data, error } = await supabase
          .from("investments")
          .update({
            investment_date: input.date,
            investment_type: input.investmentType,
            platform: input.platform,
            invested_amount: input.investedAmount,
            current_value: input.currentValue,
            withdrawn_amount: input.withdrawnAmount,
            notes: input.notes ?? null
          })
          .eq("id", id)
          .eq("user_id", user.id)
          .select("id, investment_date, investment_type, platform, invested_amount, current_value, withdrawn_amount, notes")
          .single();
        if (error) throw error;
        setState((prev) => ({
          ...prev,
          investments: prev.investments.map((item) => (item.id === id ? mapInvestment(data as DbInvestmentRow) : item))
        }));
      });
    };

    const deleteInvestment = async (id: string) => {
      if (!user) return false;
      return runMutation(async () => {
        const supabase = createBrowserSupabaseClient();
        const { error } = await supabase.from("investments").delete().eq("id", id).eq("user_id", user.id);
        if (error) throw error;
        setState((prev) => ({ ...prev, investments: prev.investments.filter((item) => item.id !== id) }));
      });
    };

    const addAsset = async (input: Omit<Asset, "id">) => {
      if (!user) return false;
      return runMutation(async () => {
        const supabase = createBrowserSupabaseClient();
        const { data, error } = await supabase
          .from("assets")
          .insert({
            user_id: user.id,
            purchase_date: input.date,
            asset_name: input.assetName,
            asset_category: input.assetCategory,
            purchase_cost: input.purchaseCost,
            current_value: input.currentValue,
            notes: input.notes ?? null
          })
          .select("id, purchase_date, asset_name, asset_category, purchase_cost, current_value, notes")
          .single();
        if (error) throw error;
        setState((prev) => ({ ...prev, assets: [mapAsset(data as DbAssetRow), ...prev.assets] }));
      });
    };

    const updateAsset = async (id: string, input: Omit<Asset, "id">) => {
      if (!user) return false;
      return runMutation(async () => {
        const supabase = createBrowserSupabaseClient();
        const { data, error } = await supabase
          .from("assets")
          .update({
            purchase_date: input.date,
            asset_name: input.assetName,
            asset_category: input.assetCategory,
            purchase_cost: input.purchaseCost,
            current_value: input.currentValue,
            notes: input.notes ?? null
          })
          .eq("id", id)
          .eq("user_id", user.id)
          .select("id, purchase_date, asset_name, asset_category, purchase_cost, current_value, notes")
          .single();
        if (error) throw error;
        setState((prev) => ({ ...prev, assets: prev.assets.map((item) => (item.id === id ? mapAsset(data as DbAssetRow) : item)) }));
      });
    };

    const deleteAsset = async (id: string) => {
      if (!user) return false;
      return runMutation(async () => {
        const supabase = createBrowserSupabaseClient();
        const { error } = await supabase.from("assets").delete().eq("id", id).eq("user_id", user.id);
        if (error) throw error;
        setState((prev) => ({ ...prev, assets: prev.assets.filter((item) => item.id !== id) }));
      });
    };

    const addBudget = async (input: Omit<Budget, "id">) => {
      if (!user) return false;
      return runMutation(async () => {
        const supabase = createBrowserSupabaseClient();
        const { data, error } = await supabase
          .from("budgets")
          .insert({
            user_id: user.id,
            month_start: `${input.month}-01`,
            category: input.category,
            budget_amount: input.amount
          })
          .select("id, month_start, category, budget_amount")
          .single();
        if (error) throw error;
        setState((prev) => ({ ...prev, budgets: [mapBudget(data as DbBudgetRow), ...prev.budgets] }));
      });
    };

    const updateBudget = async (id: string, input: Omit<Budget, "id">) => {
      if (!user) return false;
      return runMutation(async () => {
        const supabase = createBrowserSupabaseClient();
        const { data, error } = await supabase
          .from("budgets")
          .update({
            month_start: `${input.month}-01`,
            category: input.category,
            budget_amount: input.amount
          })
          .eq("id", id)
          .eq("user_id", user.id)
          .select("id, month_start, category, budget_amount")
          .single();
        if (error) throw error;
        setState((prev) => ({ ...prev, budgets: prev.budgets.map((item) => (item.id === id ? mapBudget(data as DbBudgetRow) : item)) }));
      });
    };

    const deleteBudget = async (id: string) => {
      if (!user) return false;
      return runMutation(async () => {
        const supabase = createBrowserSupabaseClient();
        const { error } = await supabase.from("budgets").delete().eq("id", id).eq("user_id", user.id);
        if (error) throw error;
        setState((prev) => ({ ...prev, budgets: prev.budgets.filter((item) => item.id !== id) }));
      });
    };

    const updateUserSettings = async (input: Partial<UserSettings>) => {
      if (!user) return false;
      return runMutation(async () => {
        const supabase = createBrowserSupabaseClient();
        const trimmedEmail = input.email?.trim();
        const nextSettings: UserSettings = {
          ...state.userSettings,
          ...input,
          email: trimmedEmail ?? state.userSettings.email,
          categories: input.categories ?? state.userSettings.categories,
          paymentMethods: input.paymentMethods ?? state.userSettings.paymentMethods,
          investmentTypes: input.investmentTypes ?? state.userSettings.investmentTypes,
          investmentPlatforms: input.investmentPlatforms ?? state.userSettings.investmentPlatforms,
          assetCategories: input.assetCategories ?? state.userSettings.assetCategories
        };

        let persistedEmail = nextSettings.email;
        if (trimmedEmail && trimmedEmail !== (user.email ?? state.userSettings.email)) {
          const { data: authData, error: authError } = await supabase.auth.updateUser({ email: trimmedEmail });
          if (authError) throw authError;
          persistedEmail = authData.user?.new_email ?? trimmedEmail;
        }

        const { error } = await supabase.from("user_settings").upsert(
          {
            user_id: user.id,
            profile_name: nextSettings.profileName,
            email: persistedEmail,
            currency: nextSettings.currency,
            categories: nextSettings.categories,
            payment_methods: nextSettings.paymentMethods,
            investment_types: nextSettings.investmentTypes,
            investment_platforms: nextSettings.investmentPlatforms,
            asset_categories: nextSettings.assetCategories,
            support_email: nextSettings.supportEmail
          },
          { onConflict: "user_id" }
        );
        if (error) throw error;

        const profileUpdate: Record<string, string> = {
          full_name: nextSettings.profileName,
          preferred_currency: nextSettings.currency,
          email: persistedEmail
        };
        const { error: profileError } = await supabase.from("profiles").update(profileUpdate).eq("id", user.id);
        if (profileError) throw profileError;

        const syncedSettings = { ...nextSettings, email: persistedEmail };

        setState((prev) => ({ ...prev, userSettings: syncedSettings }));
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                fullName: syncedSettings.profileName,
                email: syncedSettings.email,
                preferredCurrency: syncedSettings.currency
              }
            : prev
        );
      });
    };

    return {
      state,
      profile,
      loading,
      syncing,
      operationError,
      isAuthenticated: Boolean(user),
      isPaid: profile?.accessStatus === "active",
      refresh,
      clearOperationError,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addLendBorrowEntry,
      updateLendBorrowEntry,
      deleteLendBorrowEntry,
      addInvestment,
      updateInvestment,
      deleteInvestment,
      addAsset,
      updateAsset,
      deleteAsset,
      addBudget,
      updateBudget,
      deleteBudget,
      updateUserSettings,
      signOut
    };
  }, [clearOperationError, loading, operationError, profile, refresh, runMutation, signOut, state, syncing, user]);

  return <PocketFlowContext.Provider value={value}>{children}</PocketFlowContext.Provider>;
}

export function usePocketFlow() {
  const context = useContext(PocketFlowContext);
  if (!context) {
    throw new Error("usePocketFlow must be used within PocketFlowProvider");
  }
  return context;
}

export function usePocketFlowOptions() {
  const { state } = usePocketFlow();

  return useMemo(() => {
    const categories = Array.from(
      new Set([
        ...state.userSettings.categories,
        ...state.transactions.map((item) => item.category),
        ...state.budgets.map((item) => item.category)
      ])
    ).sort();

    const paymentMethods = Array.from(
      new Set([...state.userSettings.paymentMethods, ...state.transactions.map((item) => item.paymentMethod)])
    ).sort();

    const investmentTypes = Array.from(
      new Set([...state.userSettings.investmentTypes, ...state.investments.map((item) => item.investmentType)])
    ).sort();

    const investmentPlatforms = Array.from(
      new Set([...state.userSettings.investmentPlatforms, ...state.investments.map((item) => item.platform)])
    ).sort();

    const assetCategories = Array.from(
      new Set([...state.userSettings.assetCategories, ...state.assets.map((item) => item.assetCategory)])
    ).sort();

    return {
      categories,
      paymentMethods,
      investmentTypes,
      investmentPlatforms,
      assetCategories
    };
  }, [state]);
}

export function useDashboardData() {
  const { state } = usePocketFlow();
  const todayIso = getTodayIso();
  const today = new Date(todayIso);
  const monthKey = getMonthKey(todayIso);

  return useMemo(() => {
    const totalIncome = state.transactions
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + item.amount, 0);

    const totalExpenses = state.transactions
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + item.amount, 0);

    const receivables = state.lendBorrowEntries
      .filter((item) => item.type === "given")
      .reduce((sum, item) => sum + Math.max(item.amount - item.amountSettled, 0), 0);

    const payables = state.lendBorrowEntries
      .filter((item) => item.type === "borrowed")
      .reduce((sum, item) => sum + Math.max(item.amount - item.amountSettled, 0), 0);

    const totalInvestments = state.investments.reduce((sum, item) => sum + item.currentValue, 0);
    const trackedBalance = totalIncome - totalExpenses + receivables - payables;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    const currentMonthBudgets = state.budgets.filter((budget) => budget.month === monthKey);
    const totalBudget = currentMonthBudgets.reduce((sum, item) => sum + item.amount, 0);
    const currentMonthExpenses = state.transactions
      .filter((item) => item.type === "expense" && getMonthKey(item.date) === monthKey)
      .reduce((sum, item) => sum + item.amount, 0);
    const budgetUsed = totalBudget > 0 ? (currentMonthExpenses / totalBudget) * 100 : 0;

    const assetsValue = state.assets.reduce((sum, item) => sum + item.currentValue, 0);

    const expenseByCategoryMap = state.transactions
      .filter((item) => item.type === "expense" && getMonthKey(item.date) === monthKey)
      .reduce<Record<string, number>>((acc, item) => {
        acc[item.category] = (acc[item.category] ?? 0) + item.amount;
        return acc;
      }, {});

    const expenseByCategory = Object.entries(expenseByCategoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const monthBuckets = new Map<string, { income: number; expense: number }>();
    state.transactions.forEach((item) => {
      const key = getMonthKey(item.date);
      if (!monthBuckets.has(key)) monthBuckets.set(key, { income: 0, expense: 0 });
      const bucket = monthBuckets.get(key)!;
      if (item.type === "income") bucket.income += item.amount;
      else bucket.expense += item.amount;
    });

    const incomeVsExpense = Array.from(monthBuckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, values]) => ({
        month: new Intl.DateTimeFormat("en-IN", { month: "short" }).format(new Date(`${key}-01`)),
        income: values.income,
        expense: values.expense
      }));

    const investmentGrowth = [...state.investments]
      .sort((a, b) => +new Date(a.date) - +new Date(b.date))
      .map((item) => ({
        month: new Intl.DateTimeFormat("en-IN", { month: "short" }).format(new Date(item.date)),
        value: item.currentValue
      }));

    const recentTransactions = [...state.transactions]
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))
      .slice(0, 5)
      .map((item) => ({
        ...item,
        dateLabel: new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(new Date(item.date))
      }));

    const upcomingDueItems = state.lendBorrowEntries
      .map((item) => {
        const balance = Math.max(item.amount - item.amountSettled, 0);
        const dueDateValue = item.dueDate ? new Date(item.dueDate) : new Date(item.date);
        const isOverdue = item.dueDate ? new Date(item.dueDate) < today && balance > 0 : false;
        return {
          ...item,
          balance,
          dueSortValue: dueDateValue.getTime(),
          status: isOverdue ? "Overdue" : balance > 0 ? "Due soon" : "Closed"
        };
      })
      .filter((item) => item.balance > 0)
      .sort((a, b) => a.dueSortValue - b.dueSortValue)
      .slice(0, 4);

    const overdueCount = upcomingDueItems.filter((item) => item.status === "Overdue").length;

    return {
      totalIncome,
      totalExpenses,
      trackedBalance,
      savingsRate,
      budgetUsed,
      receivables,
      payables,
      totalInvestments,
      assetsValue,
      expenseByCategory,
      incomeVsExpense,
      investmentGrowth,
      recentTransactions,
      upcomingDueItems,
      overdueCount
    };
  }, [monthKey, state, today]);
}
