export type TransactionType = "income" | "expense";
export type LendBorrowType = "given" | "borrowed";
export type AccessStatus = "pending" | "active" | "blocked";
export type ThemeMode = "dark" | "light";

export type Transaction = {
  id: string;
  date: string;
  type: TransactionType;
  title: string;
  category: string;
  amount: number;
  paymentMethod: string;
  notes?: string;
  proofStoragePath?: string;
  proofFileName?: string;
  proofMimeType?: string;
};

export type TransactionMutationInput = Omit<Transaction, "id" | "proofStoragePath" | "proofFileName" | "proofMimeType"> & {
  proofFile?: File | null;
  removeProof?: boolean;
  proofStoragePath?: string;
  proofFileName?: string;
  proofMimeType?: string;
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

export type CreditCard = {
  id: string;
  cardName: string;
  issuer: string;
  billingDate: string;
  dueDate: string;
  creditLimit: number;
  currentBalance: number;
  amountPaid: number;
  notes?: string;
};

export type Loan = {
  id: string;
  loanName: string;
  lender: string;
  startDate: string;
  dueDate?: string;
  principalAmount: number;
  outstandingAmount: number;
  emiAmount: number;
  nextEmiDate?: string;
  interestRate: number;
  notes?: string;
};

export type Budget = {
  id: string;
  month: string;
  category: string;
  amount: number;
};

export type DashboardCategorySlice = {
  name: string;
  value: number;
};

export type DashboardIncomeExpensePoint = {
  month: string;
  income: number;
  expense: number;
};

export type DashboardInvestmentPoint = {
  month: string;
  value: number;
};

export type DashboardRecentTransaction = Transaction & {
  dateLabel: string;
};

export type DashboardDueItem = LendBorrowEntry & {
  balance: number;
  dueSortValue: number;
  status: "Overdue" | "Due soon" | "Closed";
};

export type DashboardSnapshot = {
  totalIncome: number;
  totalExpenses: number;
  currentBalance: number;
  savingsRate: number;
  budgetUsed: number;
  receivables: number;
  payables: number;
  totalInvestments: number;
  assetsValue: number;
  creditOutstanding: number;
  creditLimitTotal: number;
  totalLoanOutstanding: number;
  totalEmiAmount: number;
  expenseByCategory: DashboardCategorySlice[];
  incomeVsExpense: DashboardIncomeExpensePoint[];
  investmentGrowth: DashboardInvestmentPoint[];
  recentTransactions: DashboardRecentTransaction[];
  upcomingDueItems: DashboardDueItem[];
  overdueCount: number;
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
  theme: ThemeMode;
};

export type PocketFlowState = {
  transactions: Transaction[];
  lendBorrowEntries: LendBorrowEntry[];
  investments: Investment[];
  assets: Asset[];
  creditCards: CreditCard[];
  loans: Loan[];
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
  dashboardSnapshot: DashboardSnapshot | null;
  loadedScope: "empty" | "dashboard" | "full";
  profile: Profile | null;
  authEmail: string;
  authName: string;
  loading: boolean;
  syncing: boolean;
  operationError: string;
  isAuthenticated: boolean;
  isPaid: boolean;
  refresh: () => Promise<void>;
  clearOperationError: () => void;
  addTransaction: (input: TransactionMutationInput) => Promise<boolean>;
  updateTransaction: (id: string, input: TransactionMutationInput) => Promise<boolean>;
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
  addCreditCard: (input: Omit<CreditCard, "id">) => Promise<boolean>;
  updateCreditCard: (id: string, input: Omit<CreditCard, "id">) => Promise<boolean>;
  deleteCreditCard: (id: string) => Promise<boolean>;
  addLoan: (input: Omit<Loan, "id">) => Promise<boolean>;
  updateLoan: (id: string, input: Omit<Loan, "id">) => Promise<boolean>;
  deleteLoan: (id: string) => Promise<boolean>;
  addBudget: (input: Omit<Budget, "id">) => Promise<boolean>;
  updateBudget: (id: string, input: Omit<Budget, "id">) => Promise<boolean>;
  deleteBudget: (id: string) => Promise<boolean>;
  updateUserSettings: (input: Partial<UserSettings>) => Promise<boolean>;
  signOut: () => Promise<void>;
};
