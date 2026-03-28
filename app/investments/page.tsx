import { requirePaidUser } from "@/lib/auth";
import { InvestmentsPage } from "@/components/investments/investments-page";

export default async function InvestmentsRoute() {
  await requirePaidUser();
  return <InvestmentsPage />;
}
