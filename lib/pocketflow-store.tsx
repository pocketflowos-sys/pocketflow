"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { defaultPocketFlowState } from "@/lib/demo-data";
import { getMonthKey, getTodayIso } from "@/lib/formatters";
import type {
  Asset,
  Budget,
  Investment,
  LendBorrowEntry,
  PocketFlowState,
  Transaction,
  UserSettings
} from "@/lib/types";

const STORAGE_KEY = "pocketflow-demo-state";

type NewTransaction = Omit<Transaction, "id">;
type NewLendBorrow = Omit<LendBorrowEntry, "id">;
type NewInvestment = Omit<Investment, "id">;
type NewAsset = Omit<Asset, "id">;
type NewBudget = Omit<Budget, "id">;

type PocketFlowContextValue = {
  state: PocketFlowState;
  addTransaction: (input: NewTransaction) => void;
  updateTransaction: (id: string, input: NewTransaction) => void;
  deleteTransaction: (id: string) => void;
  addLendBorrowEntry: (input: NewLendBorrow) => void;
  updateLendBorrowEntry: (id: string, input: NewLendBorrow) => void;
  deleteLendBorrowEntry: (id: string) => void;
  addInvestment: (input: NewInvestment) => void;
  updateInvestment: (id: string, input: NewInvestment) => void;
  deleteInvestment: (id: string) => void;
  addAsset: (input: NewAsset) => void;
  updateAsset: (id: string, input: NewAsset) => void;
  deleteAsset: (id: string) => void;
  addBudget: (input: NewBudget) => void;
  updateBudget: (id: string, input: NewBudget) => void;
  deleteBudget: (id: string) => void;
  updateUserSettings: (input: Partial<UserSettings>) => void;
  resetDemo: () => void;
};

const PocketFlowContext = createContext<PocketFlowContextValue | null>(null);

function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function cleanState(input: PocketFlowState): PocketFlowState {
  return {
    ...input,
    transactions: Array.isArray(input.transactions) ? input.transactions : [],
    lendBorrowEntries: Array.isArray(input.lendBorrowEntries) ? input.lendBorrowEntries : [],
    investments: Array.isArray(input.investments) ? input.investments : [],
    assets: Array.isArray(input.assets) ? input.assets : [],
    budgets: Array.isArray(input.budgets) ? input.budgets : [],
    userSettings: {
      ...defaultPocketFlowState.userSettings,
      ...(input.userSettings ?? {})
    }
  };
}

export function PocketFlowProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PocketFlowState>(defaultPocketFlowState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as PocketFlowState;
        setState(cleanState(parsed));
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  const value = useMemo<PocketFlowContextValue>(() => {
    const addTransaction = (input: NewTransaction) => {
      setState((prev: PocketFlowState) => ({
        ...prev,
        transactions: [{ id: createId("txn"), ...input }, ...prev.transactions]
      }));
    };

    const updateTransaction = (id: string, input: NewTransaction) => {
      setState((prev: PocketFlowState) => ({
        ...prev,
        transactions: prev.transactions.map((item: Transaction) => (item.id === id ? { id, ...input } : item))
      }));
    };

    const deleteTransaction = (id: string) => {
      setState((prev: PocketFlowState) => ({
        ...prev,
        transactions: prev.transactions.filter((item: Transaction) => item.id !== id)
      }));
    };

    const addLendBorrowEntry = (input: NewLendBorrow) => {
      setState((prev: PocketFlowState) => ({
        ...prev,
        lendBorrowEntries: [{ id: createId("lb"), ...input }, ...prev.lendBorrowEntries]
      }));
    };

    const updateLendBorrowEntry = (id: string, input: NewLendBorrow) => {
      setState((prev: PocketFlowState) => ({
        ...prev,
        lendBorrowEntries: prev.lendBorrowEntries.map((item: LendBorrowEntry) =>
          item.id === id ? { id, ...input } : item
        )
      }));
    };

    const deleteLendBorrowEntry = (id: string) => {
      setState((prev: PocketFlowState) => ({
        ...prev,
        lendBorrowEntries: prev.lendBorrowEntries.filter((item: LendBorrowEntry) => item.id !== id)
      }));
    };

    const addInvestment = (input: NewInvestment) => {
      setState((prev: PocketFlowState) => ({
        ...prev,
        investments: [{ id: createId("inv"), ...input }, ...prev.investments]
      }));
    };

    const updateInvestment = (id: string, input: NewInvestment) => {
      setState((prev: PocketFlowState) => ({
        ...prev,
        investments: prev.investments.map((item: Investment) => (item.id === id ? { id, ...input } : item))
      }));
    };

    const deleteInvestment = (id: string) => {
      setState((prev: PocketFlowState) => ({
        ...prev,
        investments: prev.investments.filter((item: Investment) => item.id !== id)
      }));
    };

    const addAsset = (input: NewAsset) => {
      setState((prev: PocketFlowState) => ({
        ...prev,
        assets: [{ id: createId("asset"), ...input }, ...prev.assets]
      }));
    };

    const updateAsset = (id: string, input: NewAsset) => {
      setState((prev: PocketFlowState) => ({
        ...prev,
        assets: prev.assets.map((item: Asset) => (item.id === id ? { id, ...input } : item))
      }));
    };

    const deleteAsset = (id: string) => {
      setState((prev: PocketFlowState) => ({
        ...prev,
        assets: prev.assets.filter((item: Asset) => item.id !== id)
      }));
    };

    const addBudget = (input: NewBudget) => {
      setState((prev: PocketFlowState) => ({
        ...prev,
        budgets: [{ id: createId("bud"), ...input }, ...prev.budgets]
      }));
    };

    const updateBudget = (id: string, input: NewBudget) => {
      setState((prev: PocketFlowState) => ({
        ...prev,
        budgets: prev.budgets.map((item: Budget) => (item.id === id ? { id, ...input } : item))
      }));
    };

    const deleteBudget = (id: string) => {
      setState((prev: PocketFlowState) => ({
        ...prev,
        budgets: prev.budgets.filter((item: Budget) => item.id !== id)
      }));
    };

    const updateUserSettings = (input: Partial<UserSettings>) => {
      setState((prev: PocketFlowState) => ({
        ...prev,
        userSettings: {
          ...prev.userSettings,
          ...input,
          categories: input.categories ?? prev.userSettings.categories,
          paymentMethods: input.paymentMethods ?? prev.userSettings.paymentMethods,
          investmentTypes: input.investmentTypes ?? prev.userSettings.investmentTypes,
          investmentPlatforms: input.investmentPlatforms ?? prev.userSettings.investmentPlatforms,
          assetCategories: input.assetCategories ?? prev.userSettings.assetCategories
        }
      }));
    };

    const resetDemo = () => setState(defaultPocketFlowState);

    return {
      state,
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
      resetDemo
    };
  }, [state]);

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
        ...state.transactions.map((item: Transaction) => item.category),
        ...state.budgets.map((item: Budget) => item.category)
      ])
    ).sort();

    const paymentMethods = Array.from(
      new Set([...state.userSettings.paymentMethods, ...state.transactions.map((item: Transaction) => item.paymentMethod)])
    ).sort();

    const investmentTypes = Array.from(
      new Set([...state.userSettings.investmentTypes, ...state.investments.map((item: Investment) => item.investmentType)])
    ).sort();

    const investmentPlatforms = Array.from(
      new Set([...state.userSettings.investmentPlatforms, ...state.investments.map((item: Investment) => item.platform)])
    ).sort();

    const assetCategories = Array.from(
      new Set([...state.userSettings.assetCategories, ...state.assets.map((item: Asset) => item.assetCategory)])
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
      .filter((item: Transaction) => item.type === "income")
      .reduce((sum: number, item: Transaction) => sum + item.amount, 0);

    const totalExpenses = state.transactions
      .filter((item: Transaction) => item.type === "expense")
      .reduce((sum: number, item: Transaction) => sum + item.amount, 0);

    const receivables = state.lendBorrowEntries
      .filter((item: LendBorrowEntry) => item.type === "given")
      .reduce((sum: number, item: LendBorrowEntry) => sum + Math.max(item.amount - item.amountSettled, 0), 0);

    const payables = state.lendBorrowEntries
      .filter((item: LendBorrowEntry) => item.type === "borrowed")
      .reduce((sum: number, item: LendBorrowEntry) => sum + Math.max(item.amount - item.amountSettled, 0), 0);

    const totalInvestments = state.investments.reduce((sum: number, item: Investment) => sum + item.currentValue, 0);
    const currentBalance = totalIncome - totalExpenses + receivables - payables;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    const currentMonthBudgets = state.budgets.filter((budget: Budget) => budget.month === monthKey);
    const totalBudget = currentMonthBudgets.reduce((sum: number, item: Budget) => sum + item.amount, 0);
    const currentMonthExpenses = state.transactions
      .filter((item: Transaction) => item.type === "expense" && getMonthKey(item.date) === monthKey)
      .reduce((sum: number, item: Transaction) => sum + item.amount, 0);
    const budgetUsed = totalBudget > 0 ? (currentMonthExpenses / totalBudget) * 100 : 0;

    const assetsValue = state.assets.reduce((sum: number, item: Asset) => sum + item.currentValue, 0);

    const expenseByCategoryMap = state.transactions
      .filter((item: Transaction) => item.type === "expense" && getMonthKey(item.date) === monthKey)
      .reduce<Record<string, number>>((acc: Record<string, number>, item: Transaction) => {
        acc[item.category] = (acc[item.category] ?? 0) + item.amount;
        return acc;
      }, {});

    const expenseByCategory = (Object.entries(expenseByCategoryMap) as [string, number][])
      .map(([name, value]: [string, number]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const monthBuckets = new Map<string, { income: number; expense: number }>();
    state.transactions.forEach((item: Transaction) => {
      const key = getMonthKey(item.date);
      if (!monthBuckets.has(key)) {
        monthBuckets.set(key, { income: 0, expense: 0 });
      }
      const bucket = monthBuckets.get(key)!;
      if (item.type === "income") {
        bucket.income += item.amount;
      } else {
        bucket.expense += item.amount;
      }
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
      .sort((a: Investment, b: Investment) => +new Date(a.date) - +new Date(b.date))
      .map((item: Investment) => ({
        month: new Intl.DateTimeFormat("en-IN", { month: "short" }).format(new Date(item.date)),
        value: item.currentValue
      }));

    const recentTransactions = [...state.transactions]
      .sort((a: Transaction, b: Transaction) => +new Date(b.date) - +new Date(a.date))
      .slice(0, 5)
       .map((item: Transaction) => ({
        ...item,
        dateLabel: new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(new Date(item.date))
      }));

    const upcomingDueItems = state.lendBorrowEntries
      .map((item: LendBorrowEntry) => {
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
       .filter((item: { balance: number }) => item.balance > 0)
       .sort((a: { dueSortValue: number }, b: { dueSortValue: number }) => a.dueSortValue - b.dueSortValue)
      .slice(0, 4);

    const overdueCount = upcomingDueItems.filter((item: { status: string }) => item.status === "Overdue").length;

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
      expenseByCategory,
      incomeVsExpense,
      investmentGrowth,
      recentTransactions,
      upcomingDueItems,
      overdueCount
    };
  }, [monthKey, state, today]);
}
