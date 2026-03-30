import { getTodayIso } from "@/lib/formatters";

export function clampNumber(value: number, min = 0) {
  return Number.isFinite(value) ? Math.max(value, min) : min;
}

export function getBudgetStatus(percentUsed: number) {
  if (percentUsed === 0) {
    return { label: "No Spend", tone: "neutral" as const };
  }
  if (percentUsed <= 50) {
    return { label: "Spend Start", tone: "green" as const };
  }
  if (percentUsed <= 90) {
    return { label: "Medium", tone: "gold" as const };
  }
  if (percentUsed <= 100) {
    return { label: "Watch", tone: "red" as const };
  }
  return { label: "Overspent", tone: "red" as const };
}

export function getLendBorrowBalance(amount: number, amountSettled: number) {
  return Math.max(amount - amountSettled, 0);
}

export function getLendBorrowStatus(input: {
  amount: number;
  amountSettled: number;
  dueDate?: string;
}) {
  const balance = getLendBorrowBalance(input.amount, input.amountSettled);
  if (balance === 0) {
    return { label: "Closed", tone: "green" as const, overdue: false };
  }
  const overdue = Boolean(input.dueDate && new Date(input.dueDate) < new Date(getTodayIso()));
  if (input.amountSettled > 0) {
    return {
      label: overdue ? "Partial • Overdue" : "Partial",
      tone: overdue ? ("red" as const) : ("gold" as const),
      overdue
    };
  }
  return {
    label: overdue ? "Pending • Overdue" : "Pending",
    tone: overdue ? ("red" as const) : ("neutral" as const),
    overdue
  };
}

export function getInvestmentGain(currentValue: number, investedAmount: number, withdrawnAmount: number) {
  return currentValue + withdrawnAmount - investedAmount;
}

export function getInvestmentReturnPercent(currentValue: number, investedAmount: number, withdrawnAmount: number) {
  if (investedAmount <= 0) return 0;
  return (getInvestmentGain(currentValue, investedAmount, withdrawnAmount) / investedAmount) * 100;
}

export function getAssetChange(currentValue: number, purchaseCost: number) {
  return currentValue - purchaseCost;
}

export function getAssetChangePercent(currentValue: number, purchaseCost: number) {
  if (purchaseCost <= 0) return 0;
  return ((currentValue - purchaseCost) / purchaseCost) * 100;
}

export function getCreditCardOutstanding(currentBalance: number, amountPaid: number) {
  return Math.max(currentBalance - amountPaid, 0);
}

export function getCreditUtilization(currentBalance: number, creditLimit: number) {
  if (creditLimit <= 0) return 0;
  return (currentBalance / creditLimit) * 100;
}

export function getLoanOutstanding(outstandingAmount: number) {
  return Math.max(outstandingAmount, 0);
}

export function getLoanProgress(principalAmount: number, outstandingAmount: number) {
  if (principalAmount <= 0) return 0;
  return ((principalAmount - outstandingAmount) / principalAmount) * 100;
}

export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (value: string | number) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = [headers.map(escape).join(","), ...rows.map((row) => row.map(escape).join(","))].join("\n");
  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
