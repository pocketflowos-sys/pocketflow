import { requirePaidUser } from "@/lib/auth";
import { TransactionsPage } from "@/components/transactions/transactions-page";

export default async function TransactionsRoute() {
  await requirePaidUser();
  return <TransactionsPage />;
}
