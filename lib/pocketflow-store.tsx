"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { emptyPocketFlowState, emptyUserSettings } from "@/lib/defaults";
import { getMonthKey, getTodayIso } from "@/lib/formatters";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type {
  Asset,
  Budget,
  CreditCard,
  DashboardSnapshot,
  Investment,
  Loan,
  LendBorrowEntry,
  PocketFlowContextValue,
  PocketFlowState,
  Profile,
  ThemeMode,
  Transaction,
  TransactionMutationInput,
  UserSettings
} from "@/lib/types";
import { getCreditCardOutstanding, getLoanOutstanding } from "@/lib/finance";
import { removeTransactionProof, uploadTransactionProof } from "@/lib/transaction-proofs";

const PocketFlowContext = createContext<PocketFlowContextValue | null>(null);

const publicBootstrapPrefixes = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/privacy-policy",
  "/refund-policy",
  "/terms",
  "/support",
  "/success",
  "/update-password"
] as const;

function shouldBootstrapForPath(pathname: string | null) {
  if (!pathname) return false;
  return !publicBootstrapPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));
}

type BootstrapScope =
  | "dashboard"
  | "transactions"
  | "lend-borrow"
  | "credit-cards"
  | "loans"
  | "investments"
  | "assets"
  | "categories"
  | "settings"
  | "budgets"
  | "full";

function getBootstrapScope(pathname: string | null): BootstrapScope {
  if (pathname === "/dashboard") return "dashboard";
  if (pathname === "/transactions") return "transactions";
  if (pathname === "/lend-borrow") return "lend-borrow";
  if (pathname === "/credit-cards") return "credit-cards";
  if (pathname === "/loans") return "loans";
  if (pathname === "/investments") return "investments";
  if (pathname === "/assets") return "assets";
  if (pathname === "/categories") return "categories";
  if (pathname === "/settings") return "settings";
  if (pathname === "/budgets") return "budgets";
  return "full";
}

type DbTransactionRow = {
  id: string;
  transaction_date: string;
  type: Transaction["type"];
  title: string;
  category: string;
  amount: number;
  payment_method: string;
  notes: string | null;
  proof_storage_path: string | null;
  proof_file_name: string | null;
  proof_mime_type: string | null;
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

type DbCreditCardRow = {
  id: string;
  card_name: string;
  issuer: string;
  billing_date: string;
  due_date: string;
  credit_limit: number;
  current_balance: number;
  amount_paid: number;
  notes: string | null;
};

type DbLoanRow = {
  id: string;
  loan_name: string;
  lender: string;
  start_date: string;
  due_date: string | null;
  principal_amount: number;
  outstanding_amount: number;
  emi_amount: number;
  next_emi_date: string | null;
  interest_rate: number;
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
  theme: ThemeMode | null;
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

function pickFirstMeaningfulString(...values: Array<string | null | undefined>) {
  for (const value of values) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (trimmed) return trimmed;
  }
  return "";
}

function normalizeMutationError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("transaction-proofs") || lower.includes("proof_storage_path") || lower.includes("proof_file_name") || lower.includes("proof_mime_type")) {
    return "Transaction save needs the latest proof-upload database changes. Run the transaction proof migration, or save without proof after updating the codebase.";
  }
  if (lower.includes("row-level security") || lower.includes("permission denied")) {
    return "PocketFlow could not save because the database permissions rejected this action.";
  }
  return message;
}

function buildTransactionPayload(input: TransactionMutationInput, proof: { storagePath?: string | null; fileName?: string | null; mimeType?: string | null } = {}) {
  const payload: Record<string, unknown> = {
    transaction_date: input.date,
    type: input.type,
    title: input.title,
    category: input.category,
    amount: input.amount,
    payment_method: input.paymentMethod,
    notes: input.notes ?? null
  };

  if (proof.storagePath !== undefined) payload.proof_storage_path = proof.storagePath;
  if (proof.fileName !== undefined) payload.proof_file_name = proof.fileName;
  if (proof.mimeType !== undefined) payload.proof_mime_type = proof.mimeType;

  return payload;
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
    notes: row.notes ?? "",
    proofStoragePath: row.proof_storage_path ?? undefined,
    proofFileName: row.proof_file_name ?? undefined,
    proofMimeType: row.proof_mime_type ?? undefined
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

function mapCreditCard(row: DbCreditCardRow): CreditCard {
  return {
    id: row.id,
    cardName: row.card_name,
    issuer: row.issuer,
    billingDate: row.billing_date,
    dueDate: row.due_date,
    creditLimit: normalizeNumber(row.credit_limit),
    currentBalance: normalizeNumber(row.current_balance),
    amountPaid: normalizeNumber(row.amount_paid),
    notes: row.notes ?? ""
  };
}

function mapLoan(row: DbLoanRow): Loan {
  return {
    id: row.id,
    loanName: row.loan_name,
    lender: row.lender,
    startDate: row.start_date,
    dueDate: row.due_date ?? undefined,
    principalAmount: normalizeNumber(row.principal_amount),
    outstandingAmount: normalizeNumber(row.outstanding_amount),
    emiAmount: normalizeNumber(row.emi_amount),
    nextEmiDate: row.next_emi_date ?? undefined,
    interestRate: normalizeNumber(row.interest_rate),
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

function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.remove("light", "dark");
  document.documentElement.classList.add(theme);
}

function mapSettings(row: DbUserSettingsRow | null, profile: Profile | null, fallbackEmail = ""): UserSettings {
  return {
    profileName: pickFirstMeaningfulString(row?.profile_name, profile?.fullName),
    email: pickFirstMeaningfulString(row?.email, profile?.email, fallbackEmail),
    currency: pickFirstMeaningfulString(row?.currency, profile?.preferredCurrency, "INR"),
    categories: row?.categories?.length ? row.categories : emptyUserSettings.categories,
    paymentMethods: row?.payment_methods?.length ? row.payment_methods : emptyUserSettings.paymentMethods,
    investmentTypes: row?.investment_types?.length ? row.investment_types : emptyUserSettings.investmentTypes,
    investmentPlatforms: row?.investment_platforms?.length
      ? row.investment_platforms
      : emptyUserSettings.investmentPlatforms,
    assetCategories: row?.asset_categories?.length ? row.asset_categories : emptyUserSettings.assetCategories,
    supportEmail: pickFirstMeaningfulString(row?.support_email, emptyUserSettings.supportEmail),
    theme: row?.theme ?? emptyUserSettings.theme
  };
}

function mapProfile(row: DbProfileRow | null, user: User | null): Profile | null {
  if (!user) return null;
  return {
    id: user.id,
    fullName: pickFirstMeaningfulString(row?.full_name, user.user_metadata.full_name as string | undefined),
    email: pickFirstMeaningfulString(row?.email, user.email),
    preferredCurrency: pickFirstMeaningfulString(row?.preferred_currency, "INR"),
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
      support_email: emptyUserSettings.supportEmail,
      theme: emptyUserSettings.theme
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
  const [dashboardSnapshot, setDashboardSnapshot] = useState<DashboardSnapshot | null>(null);
  const [loadedScope, setLoadedScope] = useState<"empty" | BootstrapScope>("empty");
  const configured = isSupabaseConfigured();
  const pathname = usePathname();
  const canBootstrapCurrentPath = shouldBootstrapForPath(pathname);
  const realtimeRef = useRef<{ unsubscribe: () => void } | null>(null);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRefreshRef = useRef(false);
  const refreshPromiseRef = useRef<Promise<void> | null>(null);
  const lastRefreshAtRef = useRef(0);
  const lastAutoRefreshAtRef = useRef(0);
  const ensuredSettingsUserIdRef = useRef<string | null>(null);
  const userRef = useRef<User | null>(null);
  const loadedScopeRef = useRef<"empty" | BootstrapScope>("empty");
  const bootstrapGuardRef = useRef<{ key: string; at: number }>({ key: "", at: 0 });
  const bootstrapRequestRef = useRef<{ id: number; scope: BootstrapScope | "full" | "empty" }>({ id: 0, scope: "empty" });
  const bootstrapAbortRef = useRef<AbortController | null>(null);
  const autoRefreshCooldownMs = 30_000;
  const visibilityRefreshCooldownMs = 60_000;
  const realtimeEnabled = process.env.NEXT_PUBLIC_ENABLE_REALTIME === "true";

  const beginBootstrapRequest = useCallback((scope: BootstrapScope | "full") => {
    bootstrapAbortRef.current?.abort();
    const controller = new AbortController();
    const nextId = bootstrapRequestRef.current.id + 1;
    bootstrapRequestRef.current = { id: nextId, scope };
    bootstrapAbortRef.current = controller;
    return { id: nextId, controller };
  }, []);

  const isStaleBootstrapRequest = useCallback((id: number, scope: BootstrapScope | "full") => {
    return bootstrapRequestRef.current.id !== id || bootstrapRequestRef.current.scope !== scope;
  }, []);

  const clearOperationError = useCallback(() => setOperationError(""), []);

  const shouldSkipBootstrap = useCallback((currentUser: User | null, scope: BootstrapScope, force = false) => {
    if (force) return false;
    const key = `${currentUser?.id ?? "anon"}:${scope}:${pathname}`;
    const now = Date.now();
    if (bootstrapGuardRef.current.key === key && now - bootstrapGuardRef.current.at < 1500) {
      return true;
    }
    bootstrapGuardRef.current = { key, at: now };
    return false;
  }, [pathname]);

  const resetLocalState = useCallback(() => {
    ensuredSettingsUserIdRef.current = null;
    userRef.current = null;
    bootstrapAbortRef.current?.abort();
    bootstrapAbortRef.current = null;
    bootstrapRequestRef.current = { id: bootstrapRequestRef.current.id + 1, scope: "empty" };
    bootstrapGuardRef.current = { key: "", at: 0 };
    setState(emptyPocketFlowState);
    setProfile(null);
    setDashboardSnapshot(null);
    loadedScopeRef.current = "empty";
    setLoadedScope("empty");
    setOperationError("");
  }, []);


  const fetchDashboardBootstrap = useCallback(async (currentUser: User | null) => {
    const request = beginBootstrapRequest("dashboard");
    if (!configured) {
      setLoading(false);
      setOperationError("Database environment variables are missing. Add them in Vercel and .env.local.");
      return;
    }

    setSyncing(true);
    setOperationError("");

    try {
      if (!currentUser) {
        resetLocalState();
        return;
      }

      const response = await fetch("/api/dashboard-bootstrap", {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal: request.controller.signal
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error || "Failed to load your dashboard workspace.");
      }

      const payload = await response.json() as {
        profile: DbProfileRow | null;
        settings: DbUserSettingsRow | null;
        dashboard: DashboardSnapshot;
      };

      if (request.controller.signal.aborted || isStaleBootstrapRequest(request.id, "dashboard") || getBootstrapScope(pathname) !== "dashboard") {
        return;
      }

      const nextProfile = mapProfile(payload.profile, currentUser);
      const nextSettings = mapSettings(payload.settings, nextProfile, currentUser.email ?? "");
      applyTheme(nextSettings.theme);
      setProfile(nextProfile);
      setState((prev) => ({ ...prev, userSettings: nextSettings }));
      setDashboardSnapshot(payload.dashboard);
      loadedScopeRef.current = "dashboard";
      setLoadedScope("dashboard");
    } catch (error) {
      if (request.controller.signal.aborted) return;
      setOperationError(error instanceof Error ? error.message : "Failed to sync your PocketFlow dashboard.");
    } finally {
      if (isStaleBootstrapRequest(request.id, "dashboard")) return;
      setSyncing(false);
      setLoading(false);
    }
  }, [beginBootstrapRequest, configured, isStaleBootstrapRequest, pathname, resetLocalState]);

  const fetchTransactionsBootstrap = useCallback(async (currentUser: User | null) => {
    const request = beginBootstrapRequest("transactions");
    if (!configured) {
      setLoading(false);
      setOperationError("Database environment variables are missing. Add them in Vercel and .env.local.");
      return;
    }

    setSyncing(true);
    setOperationError("");

    try {
      if (!currentUser) {
        resetLocalState();
        return;
      }

      const response = await fetch("/api/transactions-bootstrap", {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal: request.controller.signal
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error || "Failed to load your transactions workspace.");
      }

      const payload = await response.json() as {
        profile: DbProfileRow | null;
        settings: DbUserSettingsRow | null;
        transactions: DbTransactionRow[];
      };

      if (request.controller.signal.aborted || isStaleBootstrapRequest(request.id, "transactions") || getBootstrapScope(pathname) !== "transactions") {
        return;
      }

      const nextProfile = mapProfile(payload.profile, currentUser);
      const nextSettings = mapSettings(payload.settings, nextProfile, currentUser.email ?? "");
      applyTheme(nextSettings.theme);
      setProfile(nextProfile);
      setDashboardSnapshot(null);
      loadedScopeRef.current = "transactions";
      setLoadedScope("transactions");
      setState((prev) => ({
        ...prev,
        transactions: (payload.transactions ?? []).map((row) => mapTransaction(row)),
        userSettings: nextSettings
      }));
    } catch (error) {
      if (request.controller.signal.aborted) return;
      setOperationError(error instanceof Error ? error.message : "Failed to sync your PocketFlow transactions.");
    } finally {
      if (isStaleBootstrapRequest(request.id, "transactions")) return;
      setSyncing(false);
      setLoading(false);
    }
  }, [beginBootstrapRequest, configured, isStaleBootstrapRequest, pathname, resetLocalState]);

  const fetchScopedPageBootstrap = useCallback(async (
    scope: Exclude<BootstrapScope, "dashboard" | "transactions" | "full">,
    currentUser: User | null
  ) => {
    const request = beginBootstrapRequest(scope);
    if (!configured) {
      setLoading(false);
      setOperationError("Database environment variables are missing. Add them in Vercel and .env.local.");
      return;
    }

    setSyncing(true);
    setOperationError("");

    try {
      if (!currentUser) {
        resetLocalState();
        return;
      }

      const response = await fetch(`/api/page-bootstrap?scope=${scope}`, {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal: request.controller.signal
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error || `Failed to load your ${scope} workspace.`);
      }

      const payload = await response.json() as {
        profile: DbProfileRow | null;
        settings: DbUserSettingsRow | null;
        lendBorrowEntries?: DbLendBorrowRow[];
        investments?: DbInvestmentRow[];
        assets?: DbAssetRow[];
        creditCards?: DbCreditCardRow[];
        loans?: DbLoanRow[];
        transactions?: DbTransactionRow[];
        budgets?: DbBudgetRow[];
      };

      if (request.controller.signal.aborted || isStaleBootstrapRequest(request.id, scope) || getBootstrapScope(pathname) !== scope) {
        return;
      }

      const nextProfile = mapProfile(payload.profile, currentUser);
      const nextSettings = mapSettings(payload.settings, nextProfile, currentUser.email ?? "");
      applyTheme(nextSettings.theme);
      setProfile(nextProfile);
      setDashboardSnapshot(null);
      loadedScopeRef.current = scope;
      setLoadedScope(scope);
      setState((prev) => ({
        ...prev,
        userSettings: nextSettings,
        ...(scope === "lend-borrow"
          ? { lendBorrowEntries: (payload.lendBorrowEntries ?? []).map((row) => mapLendBorrow(row)) }
          : {}),
        ...(scope === "credit-cards"
          ? { creditCards: (payload.creditCards ?? []).map((row) => mapCreditCard(row)) }
          : {}),
        ...(scope === "loans"
          ? { loans: (payload.loans ?? []).map((row) => mapLoan(row)) }
          : {}),
        ...(scope === "investments"
          ? { investments: (payload.investments ?? []).map((row) => mapInvestment(row)) }
          : {}),
        ...(scope === "assets"
          ? { assets: (payload.assets ?? []).map((row) => mapAsset(row)) }
          : {}),
        ...(scope === "categories"
          ? {
              transactions: (payload.transactions ?? []).map((row) => mapTransaction(row)),
              investments: (payload.investments ?? []).map((row) => mapInvestment(row)),
              assets: (payload.assets ?? []).map((row) => mapAsset(row)),
              loans: (payload.loans ?? []).map((row) => mapLoan(row))
            }
          : {}),
        ...(scope === "budgets"
          ? {
              transactions: (payload.transactions ?? []).map((row) => mapTransaction(row)),
              budgets: (payload.budgets ?? []).map((row) => mapBudget(row))
            }
          : {}),
        ...(scope === "settings" ? {} : {})
      }));
    } catch (error) {
      if (request.controller.signal.aborted) return;
      setOperationError(error instanceof Error ? error.message : `Failed to sync your PocketFlow ${scope}.`);
    } finally {
      if (isStaleBootstrapRequest(request.id, scope)) return;
      setSyncing(false);
      setLoading(false);
    }
  }, [beginBootstrapRequest, configured, isStaleBootstrapRequest, pathname, resetLocalState]);

  const fetchWorkspace = useCallback(async (currentUser: User | null) => {
    const request = beginBootstrapRequest("full");
    if (!configured) {
      setLoading(false);
      setOperationError("Database environment variables are missing. Add them in Vercel and .env.local.");
      return;
    }

    setSyncing(true);
    setOperationError("");

    try {
      if (!currentUser) {
        resetLocalState();
        return;
      }

      const supabase = createBrowserSupabaseClient();
      if (ensuredSettingsUserIdRef.current !== currentUser.id) {
        ensuredSettingsUserIdRef.current = currentUser.id;
        void ensureSettingsRow(currentUser).catch(() => {
          ensuredSettingsUserIdRef.current = null;
        });
      }

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
          .eq("id", currentUser.id)
          .maybeSingle(),
        supabase
          .from("user_settings")
          .select(
            "profile_name, email, currency, categories, payment_methods, investment_types, investment_platforms, asset_categories, support_email, theme"
          )
          .eq("user_id", currentUser.id)
          .maybeSingle(),
        supabase
          .from("transactions")
          .select("id, transaction_date, type, title, category, amount, payment_method, notes, proof_storage_path, proof_file_name, proof_mime_type")
          .eq("user_id", currentUser.id)
          .order("transaction_date", { ascending: false }),
        supabase
          .from("lend_borrow_entries")
          .select("id, entry_date, person_name, type, amount, amount_settled, due_date, notes")
          .eq("user_id", currentUser.id)
          .order("entry_date", { ascending: false }),
        supabase
          .from("investments")
          .select("id, investment_date, investment_type, platform, invested_amount, current_value, withdrawn_amount, notes")
          .eq("user_id", currentUser.id)
          .order("investment_date", { ascending: false }),
        supabase
          .from("assets")
          .select("id, purchase_date, asset_name, asset_category, purchase_cost, current_value, notes")
          .eq("user_id", currentUser.id)
          .order("purchase_date", { ascending: false }),
        supabase
          .from("credit_cards")
          .select("id, card_name, issuer, billing_date, due_date, credit_limit, current_balance, amount_paid, notes")
          .eq("user_id", currentUser.id)
          .order("due_date", { ascending: true }),
        supabase
          .from("loans")
          .select("id, loan_name, lender, start_date, due_date, principal_amount, outstanding_amount, emi_amount, next_emi_date, interest_rate, notes")
          .eq("user_id", currentUser.id)
          .order("next_emi_date", { ascending: true }),
        supabase
          .from("budgets")
          .select("id, month_start, category, budget_amount")
          .eq("user_id", currentUser.id)
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
      if (firstError) throw firstError;

      if (request.controller.signal.aborted || isStaleBootstrapRequest(request.id, "full") || getBootstrapScope(pathname) !== "full") {
        return;
      }

      const nextProfile = mapProfile((profileRes.data ?? null) as DbProfileRow | null, currentUser);
      const nextSettings = mapSettings((settingsRes.data ?? null) as DbUserSettingsRow | null, nextProfile, currentUser.email ?? "");
      applyTheme(nextSettings.theme);
      setProfile(nextProfile);
      setDashboardSnapshot(null);
      loadedScopeRef.current = "full";
      setLoadedScope("full");
      setState({
        transactions: (transactionsRes.data ?? []).map((row) => mapTransaction(row as DbTransactionRow)),
        lendBorrowEntries: (lendBorrowRes.data ?? []).map((row) => mapLendBorrow(row as DbLendBorrowRow)),
        investments: (investmentsRes.data ?? []).map((row) => mapInvestment(row as DbInvestmentRow)),
        assets: (assetsRes.data ?? []).map((row) => mapAsset(row as DbAssetRow)),
        creditCards: (creditCardsRes.data ?? []).map((row) => mapCreditCard(row as DbCreditCardRow)),
        loans: (loansRes.data ?? []).map((row) => mapLoan(row as DbLoanRow)),
        budgets: (budgetsRes.data ?? []).map((row) => mapBudget(row as DbBudgetRow)),
        userSettings: nextSettings
      });
    } catch (error) {
      if (request.controller.signal.aborted) return;
      setOperationError(error instanceof Error ? error.message : "Failed to sync your PocketFlow data.");
    } finally {
      if (isStaleBootstrapRequest(request.id, "full")) return;
      setSyncing(false);
      setLoading(false);
    }
  }, [beginBootstrapRequest, configured, isStaleBootstrapRequest, pathname, resetLocalState]);

  const refresh = useCallback(async () => {
    if (!configured) {
      setLoading(false);
      setOperationError("Database environment variables are missing. Add them in Vercel and .env.local.");
      return;
    }

    if (inFlightRefreshRef.current) {
      await refreshPromiseRef.current;
      return;
    }

    const task = (async () => {
      inFlightRefreshRef.current = true;

      try {
        let currentUser = userRef.current ?? user;
        if (!currentUser) {
          const supabase = createBrowserSupabaseClient();
          const {
            data: { user: fetchedUser },
            error: userError
          } = await supabase.auth.getUser();
          if (userError) {
            setOperationError(userError.message);
            setLoading(false);
            return;
          }
          currentUser = fetchedUser;
        }

        lastRefreshAtRef.current = Date.now();
        const scope = getBootstrapScope(pathname);
        if (scope === "dashboard" && loadedScopeRef.current !== "full") await fetchDashboardBootstrap(currentUser ?? null);
        else if (scope === "transactions" && loadedScopeRef.current !== "full") await fetchTransactionsBootstrap(currentUser ?? null);
        else if (scope !== "full" && loadedScopeRef.current !== "full") await fetchScopedPageBootstrap(scope as Exclude<BootstrapScope, "dashboard" | "transactions" | "full">, currentUser ?? null);
        else await fetchWorkspace(currentUser ?? null);
      } finally {
        inFlightRefreshRef.current = false;
        refreshPromiseRef.current = null;
      }
    })();

    refreshPromiseRef.current = task;
    await task;
  }, [configured, fetchDashboardBootstrap, fetchTransactionsBootstrap, fetchWorkspace, pathname, user]);

  const scheduleRefresh = useCallback((delay = 220) => {
    if (typeof window === "undefined" || document.visibilityState === "hidden") return;

    const now = Date.now();
    if (inFlightRefreshRef.current) return;
    if (now - lastAutoRefreshAtRef.current < autoRefreshCooldownMs) return;

    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    refreshTimeoutRef.current = setTimeout(() => {
      refreshTimeoutRef.current = null;
      if (document.visibilityState === "hidden") return;
      if (Date.now() - lastAutoRefreshAtRef.current < autoRefreshCooldownMs) return;
      lastAutoRefreshAtRef.current = Date.now();
      void refresh();
    }, delay);
  }, [autoRefreshCooldownMs, refresh]);

  useEffect(() => {
    let active = true;
    if (!configured) {
      setLoading(false);
      setOperationError("Database environment variables are missing. Add them in Vercel and .env.local.");
      return;
    }

    const supabase = createBrowserSupabaseClient();

    supabase.auth.getSession().then(async ({ data, error }) => {
      if (!active) return;
      if (error) {
        setOperationError(error.message);
        setLoading(false);
        return;
      }

      const nextUser = data.session?.user ?? null;
      userRef.current = nextUser;
      setUser(nextUser);
      if (!canBootstrapCurrentPath) {
        setLoading(false);
        return;
      }
      const nextScope = getBootstrapScope(pathname);
      if (shouldSkipBootstrap(nextUser, nextScope)) {
        setLoading(false);
        return;
      }
      if (nextScope === "dashboard") await fetchDashboardBootstrap(nextUser);
      else if (nextScope === "transactions") await fetchTransactionsBootstrap(nextUser);
      else if (nextScope !== "full") await fetchScopedPageBootstrap(nextScope as Exclude<BootstrapScope, "dashboard" | "transactions" | "full">, nextUser);
      else await fetchWorkspace(nextUser);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      const nextUser = session?.user ?? null;
      const previousUserId = userRef.current?.id ?? null;
      const nextUserId = nextUser?.id ?? null;

      userRef.current = nextUser;
      setUser(nextUser);

      if (event === "INITIAL_SESSION") {
        return;
      }

      if (event === "SIGNED_OUT") {
        resetLocalState();
        setLoading(false);
        return;
      }

      if (!canBootstrapCurrentPath) {
        setLoading(false);
        return;
      }

      if (event === "SIGNED_IN" || event === "USER_UPDATED" || event === "TOKEN_REFRESHED" || previousUserId !== nextUserId) {
        lastAutoRefreshAtRef.current = Date.now();
        const nextScope = getBootstrapScope(pathname);
        if (shouldSkipBootstrap(nextUser, nextScope, event === "TOKEN_REFRESHED")) {
          setLoading(false);
          return;
        }
        if (nextScope === "dashboard") void fetchDashboardBootstrap(nextUser);
        else if (nextScope === "transactions") void fetchTransactionsBootstrap(nextUser);
        else if (nextScope !== "full") void fetchScopedPageBootstrap(nextScope as Exclude<BootstrapScope, "dashboard" | "transactions" | "full">, nextUser);
        else void fetchWorkspace(nextUser);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [canBootstrapCurrentPath, configured, fetchDashboardBootstrap, fetchTransactionsBootstrap, fetchScopedPageBootstrap, fetchWorkspace, pathname, resetLocalState, shouldSkipBootstrap]);

  useEffect(() => {
    bootstrapGuardRef.current = { key: "", at: 0 };
  }, [pathname]);

  useEffect(() => {
    if (!configured) return;
    if (!userRef.current) return;
    const scope = getBootstrapScope(pathname);

    if (shouldSkipBootstrap(userRef.current, scope)) {
      return;
    }

    if (scope === "dashboard" && loadedScopeRef.current !== "dashboard") {
      void fetchDashboardBootstrap(userRef.current);
      return;
    }

    if (scope === "transactions" && loadedScopeRef.current !== "transactions") {
      void fetchTransactionsBootstrap(userRef.current);
      return;
    }

    if (scope !== "full" && loadedScopeRef.current !== scope) {
      void fetchScopedPageBootstrap(scope as Exclude<BootstrapScope, "dashboard" | "transactions" | "full">, userRef.current);
      return;
    }

    if (scope === "full" && loadedScopeRef.current !== "full") {
      void fetchWorkspace(userRef.current);
    }
  }, [
    configured,
    fetchDashboardBootstrap,
    fetchTransactionsBootstrap,
    fetchScopedPageBootstrap,
    fetchWorkspace,
    pathname,
    shouldSkipBootstrap
  ]);

  useEffect(() => {
    if (!configured || !user || !realtimeEnabled) return;
    const supabase = createBrowserSupabaseClient();

    realtimeRef.current?.unsubscribe();

    const channel = supabase.channel(`pocketflow-sync-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${user.id}` }, () => scheduleRefresh(260))
      .on("postgres_changes", { event: "*", schema: "public", table: "lend_borrow_entries", filter: `user_id=eq.${user.id}` }, () => scheduleRefresh(260))
      .on("postgres_changes", { event: "*", schema: "public", table: "investments", filter: `user_id=eq.${user.id}` }, () => scheduleRefresh(260))
      .on("postgres_changes", { event: "*", schema: "public", table: "assets", filter: `user_id=eq.${user.id}` }, () => scheduleRefresh(260))
      .on("postgres_changes", { event: "*", schema: "public", table: "credit_cards", filter: `user_id=eq.${user.id}` }, () => scheduleRefresh(260))
      .on("postgres_changes", { event: "*", schema: "public", table: "loans", filter: `user_id=eq.${user.id}` }, () => scheduleRefresh(260))
      .on("postgres_changes", { event: "*", schema: "public", table: "budgets", filter: `user_id=eq.${user.id}` }, () => scheduleRefresh(260))
      .subscribe();

    realtimeRef.current = {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      }
    };

    return () => {
      supabase.removeChannel(channel);
      realtimeRef.current = null;
    };
  }, [configured, realtimeEnabled, scheduleRefresh, user]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastAutoRefreshAtRef.current < visibilityRefreshCooldownMs) return;
      scheduleRefresh(180);
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible, { passive: true });
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [scheduleRefresh, visibilityRefreshCooldownMs]);

  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    applyTheme(state.userSettings.theme);
  }, [state.userSettings.theme]);

  const signOut = useCallback(async () => {
    if (!configured) return;
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    resetLocalState();
    ensuredSettingsUserIdRef.current = null;
    userRef.current = null;
    setUser(null);
  }, [configured, resetLocalState]);

  const runMutation = useCallback(async (callback: () => Promise<void>) => {
    try {
      setOperationError("");
      await callback();
      return true;
    } catch (error) {
      setOperationError(error instanceof Error ? normalizeMutationError(error.message) : "We could not save your changes.");
      return false;
    }
  }, []);

  const value = useMemo<PocketFlowContextValue>(() => {
    const syncDashboardAfterMutation = async () => {
      if (loadedScopeRef.current === "dashboard") {
        await refresh();
      }
    };

    const addTransaction = async (input: TransactionMutationInput) => {
      if (!user) return false;
      return runMutation(async () => {
        const supabase = createBrowserSupabaseClient();
        let proofStoragePath: string | null | undefined = input.proofStoragePath;
        let proofFileName: string | null | undefined = input.proofFileName;
        let proofMimeType: string | null | undefined = input.proofMimeType;

        if (input.proofFile) {
          const uploaded = await uploadTransactionProof(supabase, user.id, input.proofFile);
          proofStoragePath = uploaded.path;
          proofFileName = uploaded.fileName;
          proofMimeType = uploaded.mimeType;
        }

        const transactionPayload = buildTransactionPayload(input, {
          storagePath: proofStoragePath,
          fileName: proofFileName,
          mimeType: proofMimeType
        });

        const { data, error } = await supabase
          .from("transactions")
          .insert({
            user_id: user.id,
            ...transactionPayload
          })
          .select("id, transaction_date, type, title, category, amount, payment_method, notes, proof_storage_path, proof_file_name, proof_mime_type")
          .single();
        if (error) {
          if (proofStoragePath) {
            await removeTransactionProof(supabase, proofStoragePath).catch(() => undefined);
          }
          throw error;
        }
        setState((prev) => ({ ...prev, transactions: [mapTransaction(data as DbTransactionRow), ...prev.transactions] }));
        await syncDashboardAfterMutation();
      });
    };

    const updateTransaction = async (id: string, input: TransactionMutationInput) => {
      if (!user) return false;
      return runMutation(async () => {
        const supabase = createBrowserSupabaseClient();
        const existing = state.transactions.find((item) => item.id === id);
        let proofStoragePath: string | null | undefined = input.proofStoragePath ?? existing?.proofStoragePath;
        let proofFileName: string | null | undefined = input.proofFileName ?? existing?.proofFileName;
        let proofMimeType: string | null | undefined = input.proofMimeType ?? existing?.proofMimeType;

        if (input.removeProof && existing?.proofStoragePath) {
          await removeTransactionProof(supabase, existing.proofStoragePath).catch(() => undefined);
          proofStoragePath = null;
          proofFileName = null;
          proofMimeType = null;
        }

        if (input.proofFile) {
          const uploaded = await uploadTransactionProof(supabase, user.id, input.proofFile);
          if (existing?.proofStoragePath && existing.proofStoragePath !== uploaded.path) {
            await removeTransactionProof(supabase, existing.proofStoragePath).catch(() => undefined);
          }
          proofStoragePath = uploaded.path;
          proofFileName = uploaded.fileName;
          proofMimeType = uploaded.mimeType;
        }

        const transactionPayload = buildTransactionPayload(input, {
          storagePath: proofStoragePath,
          fileName: proofFileName,
          mimeType: proofMimeType
        });

        const { data, error } = await supabase
          .from("transactions")
          .update(transactionPayload)
          .eq("id", id)
          .eq("user_id", user.id)
          .select("id, transaction_date, type, title, category, amount, payment_method, notes, proof_storage_path, proof_file_name, proof_mime_type")
          .single();
        if (error) throw error;
        setState((prev) => ({
          ...prev,
          transactions: prev.transactions.map((item) => (item.id === id ? mapTransaction(data as DbTransactionRow) : item))
        }));
        await syncDashboardAfterMutation();
      });
    };

    const deleteTransaction = async (id: string) => {
      if (!user) return false;
      return runMutation(async () => {
        const supabase = createBrowserSupabaseClient();
        const existing = state.transactions.find((item) => item.id === id);
        const { error } = await supabase.from("transactions").delete().eq("id", id).eq("user_id", user.id);
        if (error) throw error;
        if (existing?.proofStoragePath) {
          await removeTransactionProof(supabase, existing.proofStoragePath).catch(() => undefined);
        }
        setState((prev) => ({ ...prev, transactions: prev.transactions.filter((item) => item.id !== id) }));
        await syncDashboardAfterMutation();
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
        setState((prev) => ({ ...prev, lendBorrowEntries: [mapLendBorrow(data as DbLendBorrowRow), ...prev.lendBorrowEntries] }));
        await syncDashboardAfterMutation();
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
        await syncDashboardAfterMutation();
      });
    };

    const deleteLendBorrowEntry = async (id: string) => {
      if (!user) return false;
      return runMutation(async () => {
        const supabase = createBrowserSupabaseClient();
        const { error } = await supabase.from("lend_borrow_entries").delete().eq("id", id).eq("user_id", user.id);
        if (error) throw error;
        setState((prev) => ({ ...prev, lendBorrowEntries: prev.lendBorrowEntries.filter((item) => item.id !== id) }));
        await syncDashboardAfterMutation();
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
        await syncDashboardAfterMutation();
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
        await syncDashboardAfterMutation();
      });
    };

    const deleteInvestment = async (id: string) => {
      if (!user) return false;
      return runMutation(async () => {
        const supabase = createBrowserSupabaseClient();
        const { error } = await supabase.from("investments").delete().eq("id", id).eq("user_id", user.id);
        if (error) throw error;
        setState((prev) => ({ ...prev, investments: prev.investments.filter((item) => item.id !== id) }));
        await syncDashboardAfterMutation();
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
        await syncDashboardAfterMutation();
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
        await syncDashboardAfterMutation();
      });
    };

    const deleteAsset = async (id: string) => {
      if (!user) return false;
      return runMutation(async () => {
        const supabase = createBrowserSupabaseClient();
        const { error } = await supabase.from("assets").delete().eq("id", id).eq("user_id", user.id);
        if (error) throw error;
        setState((prev) => ({ ...prev, assets: prev.assets.filter((item) => item.id !== id) }));
        await syncDashboardAfterMutation();
      });
    };

    const addCreditCard = async (input: Omit<CreditCard, "id">) => {
      if (!user) return false;
      return runMutation(async () => {
        const supabase = createBrowserSupabaseClient();
        const { data, error } = await supabase
          .from("credit_cards")
          .insert({
            user_id: user.id,
            card_name: input.cardName,
            issuer: input.issuer,
            billing_date: input.billingDate,
            due_date: input.dueDate,
            credit_limit: input.creditLimit,
            current_balance: input.currentBalance,
            amount_paid: input.amountPaid,
            notes: input.notes ?? null
          })
          .select("id, card_name, issuer, billing_date, due_date, credit_limit, current_balance, amount_paid, notes")
          .single();
        if (error) throw error;
        setState((prev) => ({ ...prev, creditCards: [mapCreditCard(data as DbCreditCardRow), ...prev.creditCards] }));
        await syncDashboardAfterMutation();
      });
    };

    const updateCreditCard = async (id: string, input: Omit<CreditCard, "id">) => {
      if (!user) return false;
      return runMutation(async () => {
        const supabase = createBrowserSupabaseClient();
        const { data, error } = await supabase
          .from("credit_cards")
          .update({
            card_name: input.cardName,
            issuer: input.issuer,
            billing_date: input.billingDate,
            due_date: input.dueDate,
            credit_limit: input.creditLimit,
            current_balance: input.currentBalance,
            amount_paid: input.amountPaid,
            notes: input.notes ?? null
          })
          .eq("id", id)
          .eq("user_id", user.id)
          .select("id, card_name, issuer, billing_date, due_date, credit_limit, current_balance, amount_paid, notes")
          .single();
        if (error) throw error;
        setState((prev) => ({
          ...prev,
          creditCards: prev.creditCards.map((item) => (item.id === id ? mapCreditCard(data as DbCreditCardRow) : item))
        }));
      });
    };

    const deleteCreditCard = async (id: string) => {
      if (!user) return false;
      return runMutation(async () => {
        const supabase = createBrowserSupabaseClient();
        const { error } = await supabase.from("credit_cards").delete().eq("id", id).eq("user_id", user.id);
        if (error) throw error;
        setState((prev) => ({ ...prev, creditCards: prev.creditCards.filter((item) => item.id !== id) }));
        await syncDashboardAfterMutation();
      });
    };

    const addLoan = async (input: Omit<Loan, "id">) => {
      if (!user) return false;
      return runMutation(async () => {
        const supabase = createBrowserSupabaseClient();
        const { data, error } = await supabase
          .from("loans")
          .insert({
            user_id: user.id,
            loan_name: input.loanName,
            lender: input.lender,
            start_date: input.startDate,
            due_date: input.dueDate ?? null,
            principal_amount: input.principalAmount,
            outstanding_amount: input.outstandingAmount,
            emi_amount: input.emiAmount,
            next_emi_date: input.nextEmiDate ?? null,
            interest_rate: input.interestRate,
            notes: input.notes ?? null
          })
          .select("id, loan_name, lender, start_date, due_date, principal_amount, outstanding_amount, emi_amount, next_emi_date, interest_rate, notes")
          .single();
        if (error) throw error;
        setState((prev) => ({ ...prev, loans: [mapLoan(data as DbLoanRow), ...prev.loans] }));
        await syncDashboardAfterMutation();
      });
    };

    const updateLoan = async (id: string, input: Omit<Loan, "id">) => {
      if (!user) return false;
      return runMutation(async () => {
        const supabase = createBrowserSupabaseClient();
        const { data, error } = await supabase
          .from("loans")
          .update({
            loan_name: input.loanName,
            lender: input.lender,
            start_date: input.startDate,
            due_date: input.dueDate ?? null,
            principal_amount: input.principalAmount,
            outstanding_amount: input.outstandingAmount,
            emi_amount: input.emiAmount,
            next_emi_date: input.nextEmiDate ?? null,
            interest_rate: input.interestRate,
            notes: input.notes ?? null
          })
          .eq("id", id)
          .eq("user_id", user.id)
          .select("id, loan_name, lender, start_date, due_date, principal_amount, outstanding_amount, emi_amount, next_emi_date, interest_rate, notes")
          .single();
        if (error) throw error;
        setState((prev) => ({ ...prev, loans: prev.loans.map((item) => (item.id === id ? mapLoan(data as DbLoanRow) : item)) }));
        await syncDashboardAfterMutation();
      });
    };

    const deleteLoan = async (id: string) => {
      if (!user) return false;
      return runMutation(async () => {
        const supabase = createBrowserSupabaseClient();
        const { error } = await supabase.from("loans").delete().eq("id", id).eq("user_id", user.id);
        if (error) throw error;
        setState((prev) => ({ ...prev, loans: prev.loans.filter((item) => item.id !== id) }));
        await syncDashboardAfterMutation();
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
        await syncDashboardAfterMutation();
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
        await syncDashboardAfterMutation();
      });
    };

    const deleteBudget = async (id: string) => {
      if (!user) return false;
      return runMutation(async () => {
        const supabase = createBrowserSupabaseClient();
        const { error } = await supabase.from("budgets").delete().eq("id", id).eq("user_id", user.id);
        if (error) throw error;
        setState((prev) => ({ ...prev, budgets: prev.budgets.filter((item) => item.id !== id) }));
        await syncDashboardAfterMutation();
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
          assetCategories: input.assetCategories ?? state.userSettings.assetCategories,
          theme: input.theme ?? state.userSettings.theme
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
            support_email: nextSettings.supportEmail,
            theme: nextSettings.theme
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
        applyTheme(syncedSettings.theme);
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
      dashboardSnapshot,
      loadedScope,
      profile,
      authEmail: user?.email ?? "",
      authName: pickFirstMeaningfulString((user?.user_metadata.full_name as string | undefined) ?? ""),
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
      addCreditCard,
      updateCreditCard,
      deleteCreditCard,
      addLoan,
      updateLoan,
      deleteLoan,
      addBudget,
      updateBudget,
      deleteBudget,
      updateUserSettings,
      signOut
    };
  }, [clearOperationError, dashboardSnapshot, loadedScope, loading, operationError, profile, refresh, runMutation, signOut, state, syncing, user]);

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
  const { state, dashboardSnapshot, loadedScope } = usePocketFlow();
  const todayIso = getTodayIso();
  const today = new Date(todayIso);
  const monthKey = getMonthKey(todayIso);

  return useMemo(() => {
    if (loadedScope === "dashboard" && dashboardSnapshot) return dashboardSnapshot;

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
    const currentBalance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    const currentMonthBudgets = state.budgets.filter((budget) => budget.month === monthKey);
    const totalBudget = currentMonthBudgets.reduce((sum, item) => sum + item.amount, 0);
    const currentMonthExpenses = state.transactions
      .filter((item) => item.type === "expense" && getMonthKey(item.date) === monthKey)
      .reduce((sum, item) => sum + item.amount, 0);
    const budgetUsed = totalBudget > 0 ? (currentMonthExpenses / totalBudget) * 100 : 0;

    const assetsValue = state.assets.reduce((sum, item) => sum + item.currentValue, 0);
    const creditOutstanding = state.creditCards.reduce((sum, item) => sum + getCreditCardOutstanding(item.currentBalance, item.amountPaid), 0);
    const creditLimitTotal = state.creditCards.reduce((sum, item) => sum + item.creditLimit, 0);
    const totalLoanOutstanding = state.loans.reduce((sum, item) => sum + getLoanOutstanding(item.outstandingAmount), 0);
    const totalEmiAmount = state.loans.reduce((sum, item) => sum + item.emiAmount, 0);

    const expenseByCategoryMap = state.transactions
      .filter((item) => item.type === "expense" && getMonthKey(item.date) === monthKey)
      .reduce<Record<string, number>>((acc, item) => {
        acc[item.category] = (acc[item.category] ?? 0) + item.amount;
        return acc;
      }, {});

    const expenseByCategory = Object.entries(expenseByCategoryMap)
      .map(([name, value]) => ({ name, value: Number(value) }))
      .sort((a, b) => Number(b.value) - Number(a.value));

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

    const creditCardItems = state.creditCards
      .map((item) => ({
        ...item,
        outstanding: getCreditCardOutstanding(item.currentBalance, item.amountPaid),
        dueSortValue: new Date(item.dueDate).getTime(),
        overdue: new Date(item.dueDate) < today && getCreditCardOutstanding(item.currentBalance, item.amountPaid) > 0
      }))
      .filter((item) => item.outstanding > 0)
      .sort((a, b) => a.dueSortValue - b.dueSortValue)
      .slice(0, 4);

    const loanItems = state.loans
      .map((item) => ({
        ...item,
        dueSortValue: new Date(item.nextEmiDate ?? item.dueDate ?? item.startDate).getTime(),
        overdue: Boolean(item.nextEmiDate && new Date(item.nextEmiDate) < today && item.emiAmount > 0)
      }))
      .sort((a, b) => a.dueSortValue - b.dueSortValue)
      .slice(0, 4);

    const overdueCount = upcomingDueItems.filter((item) => item.status === "Overdue").length + creditCardItems.filter((item) => item.overdue).length + loanItems.filter((item) => item.overdue).length;

    return {
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
      creditCardItems,
      loanItems,
      overdueCount
    };
  }, [dashboardSnapshot, loadedScope, monthKey, state, today]);
}
