import type { PocketFlowState } from "@/lib/types";

export const defaultPocketFlowState: PocketFlowState = {
  transactions: [
    {
      id: "txn_1",
      date: "2026-03-27",
      type: "income",
      title: "Salary credited",
      category: "Salary",
      amount: 85000,
      paymentMethod: "Bank",
      notes: "Monthly salary"
    },
    {
      id: "txn_2",
      date: "2026-03-26",
      type: "expense",
      title: "House rent",
      category: "Housing",
      amount: 18000,
      paymentMethod: "Bank"
    },
    {
      id: "txn_3",
      date: "2026-03-25",
      type: "income",
      title: "Client payment",
      category: "Business",
      amount: 45000,
      paymentMethod: "UPI"
    },
    {
      id: "txn_4",
      date: "2026-03-24",
      type: "expense",
      title: "Groceries",
      category: "Food",
      amount: 2750,
      paymentMethod: "UPI"
    },
    {
      id: "txn_5",
      date: "2026-03-18",
      type: "expense",
      title: "Electricity bill",
      category: "Bills",
      amount: 3100,
      paymentMethod: "UPI"
    },
    {
      id: "txn_6",
      date: "2026-02-22",
      type: "expense",
      title: "Flight booking",
      category: "Travel",
      amount: 8500,
      paymentMethod: "Card"
    },
    {
      id: "txn_7",
      date: "2026-02-15",
      type: "income",
      title: "Freelance project",
      category: "Freelance",
      amount: 38000,
      paymentMethod: "Bank"
    },
    {
      id: "txn_8",
      date: "2026-01-12",
      type: "expense",
      title: "Phone upgrade",
      category: "Shopping",
      amount: 22000,
      paymentMethod: "Card"
    }
  ],
  lendBorrowEntries: [
    {
      id: "lb_1",
      date: "2026-03-05",
      person: "Afsal",
      type: "given",
      amount: 15000,
      amountSettled: 3000,
      dueDate: "2026-03-29",
      notes: "Wedding advance support"
    },
    {
      id: "lb_2",
      date: "2026-03-02",
      person: "Niyas",
      type: "borrowed",
      amount: 7500,
      amountSettled: 0,
      dueDate: "2026-03-24"
    },
    {
      id: "lb_3",
      date: "2026-03-08",
      person: "Ramees",
      type: "given",
      amount: 20000,
      amountSettled: 4500,
      dueDate: "2026-03-31"
    }
  ],
  investments: [
    {
      id: "inv_1",
      date: "2025-10-10",
      investmentType: "Mutual Fund",
      platform: "Groww",
      investedAmount: 180000,
      currentValue: 214000,
      withdrawnAmount: 0,
      notes: "Long-term SIP basket"
    },
    {
      id: "inv_2",
      date: "2025-12-05",
      investmentType: "Stocks",
      platform: "Zerodha",
      investedAmount: 120000,
      currentValue: 147500,
      withdrawnAmount: 12000,
      notes: "Indian equities"
    },
    {
      id: "inv_3",
      date: "2026-01-20",
      investmentType: "Gold",
      platform: "Bank",
      investedAmount: 90000,
      currentValue: 101000,
      withdrawnAmount: 0
    }
  ],
  assets: [
    {
      id: "asset_1",
      date: "2024-06-18",
      assetName: "MacBook Pro",
      assetCategory: "Electronics",
      purchaseCost: 165000,
      currentValue: 125000,
      notes: "Primary work machine"
    },
    {
      id: "asset_2",
      date: "2023-04-10",
      assetName: "Bike",
      assetCategory: "Vehicle",
      purchaseCost: 95000,
      currentValue: 72000
    },
    {
      id: "asset_3",
      date: "2025-08-01",
      assetName: "Camera kit",
      assetCategory: "Equipment",
      purchaseCost: 210000,
      currentValue: 185000,
      notes: "Event shooting equipment"
    }
  ],
  budgets: [
    { id: "bud_1", month: "2026-03", category: "Food", amount: 12000 },
    { id: "bud_2", month: "2026-03", category: "Housing", amount: 20000 },
    { id: "bud_3", month: "2026-03", category: "Bills", amount: 6000 },
    { id: "bud_4", month: "2026-03", category: "Travel", amount: 10000 },
    { id: "bud_5", month: "2026-03", category: "Shopping", amount: 25000 }
  ],
  userSettings: {
    profileName: "PocketFlow User",
    email: "user@example.com",
    currency: "INR",
    categories: [
      "Salary",
      "Business",
      "Freelance",
      "Food",
      "Housing",
      "Bills",
      "Travel",
      "Shopping",
      "Investment",
      "Health"
    ],
    paymentMethods: ["UPI", "Bank", "Card", "Cash"],
    investmentTypes: ["Mutual Fund", "Stocks", "Gold", "FD", "Crypto"],
    investmentPlatforms: ["Groww", "Zerodha", "Bank", "CoinSwitch"],
    assetCategories: ["Electronics", "Vehicle", "Equipment", "Property", "Gold"],
    supportEmail: "support@pocketflow.app"
  }
};
