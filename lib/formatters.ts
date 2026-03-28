function parseInputDate(date: string) {
  if (!date) return new Date();
  if (/^\d{4}-\d{2}$/.test(date)) {
    const [year, month] = date.split('-').map(Number);
    return new Date(year, month - 1, 1);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(date);
}

export function formatCurrency(value: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(value);
}

export function formatCompactDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short"
  }).format(parseInputDate(date));
}

export function formatFullDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(parseInputDate(date));
}

export function formatCsvDate(date: string) {
  return `'${date}`;
}

export function getMonthKey(date: string) {
  const d = parseInputDate(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function getMonthLabel(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "short"
  }).format(parseInputDate(date));
}

export function formatMonthLabel(monthKey: string) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric"
  }).format(parseInputDate(`${monthKey}-01`));
}

export function getTodayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
}

export function formatPercent(value: number, maximumFractionDigits = 0) {
  const safeValue = Number.isFinite(value) ? value : 0;
  return `${new Intl.NumberFormat("en-IN", { maximumFractionDigits }).format(safeValue)}%`;
}
