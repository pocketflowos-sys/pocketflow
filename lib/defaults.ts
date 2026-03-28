import type { PocketFlowState, UserSettings } from "@/lib/types";

export const DEFAULT_CATEGORIES = [
  "Food",
  "Housing",
  "Bills",
  "Travel",
  "Shopping",
  "Health",
  "Education",
  "Salary",
  "Business",
  "Investment"
];

export const DEFAULT_PAYMENT_METHODS = ["UPI", "Bank", "Cash", "Card", "Wallet"];
export const DEFAULT_INVESTMENT_TYPES = ["Mutual Fund", "Stock", "FD", "Gold", "Crypto", "Other"];
export const DEFAULT_INVESTMENT_PLATFORMS = ["Groww", "Zerodha", "Upstox", "Bank", "Other"];
export const DEFAULT_ASSET_CATEGORIES = ["Electronics", "Vehicle", "Property", "Jewellery", "Furniture", "Other"];

export const emptyUserSettings: UserSettings = {
  profileName: "",
  email: "",
  currency: "INR",
  categories: DEFAULT_CATEGORIES,
  paymentMethods: DEFAULT_PAYMENT_METHODS,
  investmentTypes: DEFAULT_INVESTMENT_TYPES,
  investmentPlatforms: DEFAULT_INVESTMENT_PLATFORMS,
  assetCategories: DEFAULT_ASSET_CATEGORIES,
  supportEmail: process.env.SUPPORT_EMAIL ?? "support@pocketflowos.in"
};

export const emptyPocketFlowState: PocketFlowState = {
  transactions: [],
  lendBorrowEntries: [],
  investments: [],
  assets: [],
  budgets: [],
  userSettings: emptyUserSettings
};
