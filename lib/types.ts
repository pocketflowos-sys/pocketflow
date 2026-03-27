export type TransactionType = "income" | "expense";

export type Transaction = {
  id: string;
  date: string;
  type: TransactionType;
  title: string;
  category: string;
  amount: number;
  paymentMethod: string;
  notes?: string;
};

export type LendBorrowEntry = {
  id: string;
  date: string;
  person: string;
  type: "given" | "borrowed";
  amount: number;
  amountSettled: number;
  dueDate?: string;
  notes?: string;
};

export type Investment = {
  id: string;
  date: string;
  investmentType: string;
  platform: string;
  investedAmount: number;
  currentValue: number;
  withdrawnAmount: number;
  notes?: string;
};

export type Asset = {
  id: string;
  date: string;
  assetName: string;
  assetCategory: string;
  purchaseCost: number;
  currentValue: number;
  notes?: string;
};

export type Budget = {
  id: string;
  month: string;
  category: string;
  amount: number;
};

export type UserSettings = {
  profileName: string;
  email: string;
  currency: string;
  categories: string[];
  paymentMethods: string[];
  investmentTypes: string[];
  investmentPlatforms: string[];
  assetCategories: string[];
  supportEmail: string;
};

export type PocketFlowState = {
  transactions: Transaction[];
  lendBorrowEntries: LendBorrowEntry[];
  investments: Investment[];
  assets: Asset[];
  budgets: Budget[];
  userSettings: UserSettings;
};
