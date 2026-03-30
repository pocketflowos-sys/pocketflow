import { requirePaidUser } from "@/lib/auth";
import { LoansPage } from "@/components/loans/loans-page";

export default async function LoansRoute() {
  await requirePaidUser();
  return <LoansPage />;
}
