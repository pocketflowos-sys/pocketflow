import { requirePaidUser } from "@/lib/auth";
import { BudgetsPage } from "@/components/budgets/budgets-page";

export default async function BudgetsRoute() {
  await requirePaidUser();
  return <BudgetsPage />;
}
