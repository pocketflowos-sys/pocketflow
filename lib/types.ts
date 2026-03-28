export type TransactionType = "income" | "expense";
export type LendBorrowType = "given" | "borrowed";
export type AccessStatus = "pending" | "active" | "blocked";

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
  type: LendBorrowType;
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

export type Profile = {
  id: string;
  fullName: string;
  email: string;
  preferredCurrency: string;
  accessStatus: AccessStatus;
  paidAt?: string | null;
};

export type PaymentRecord = {
  id: string;
  orderId: string;
  paymentId?: string | null;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
};

export type PocketFlowContextValue = {
  state: PocketFlowState;
  profile: Profile | null;
  loading: boolean;
  syncing: boolean;
  operationError: string;
  isAuthenticated: boolean;
  isPaid: boolean;
  refresh: () => Promise<void>;
  clearOperationError: () => void;
  addTransaction: (input: Omit<Transaction, "id">) => Promise<boolean>;
  updateTransaction: (id: string, input: Omit<Transaction, "id">) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;
  addLendBorrowEntry: (input: Omit<LendBorrowEntry, "id">) => Promise<boolean>;
  updateLendBorrowEntry: (id: string, input: Omit<LendBorrowEntry, "id">) => Promise<boolean>;
  deleteLendBorrowEntry: (id: string) => Promise<boolean>;
  addInvestment: (input: Omit<Investment, "id">) => Promise<boolean>;
  updateInvestment: (id: string, input: Omit<Investment, "id">) => Promise<boolean>;
  deleteInvestment: (id: string) => Promise<boolean>;
  addAsset: (input: Omit<Asset, "id">) => Promise<boolean>;
  updateAsset: (id: string, input: Omit<Asset, "id">) => Promise<boolean>;
  deleteAsset: (id: string) => Promise<boolean>;
  addBudget: (input: Omit<Budget, "id">) => Promise<boolean>;
  updateBudget: (id: string, input: Omit<Budget, "id">) => Promise<boolean>;
  deleteBudget: (id: string) => Promise<boolean>;
  updateUserSettings: (input: Partial<UserSettings>) => Promise<boolean>;
  signOut: () => Promise<void>;
};
