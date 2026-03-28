import { requirePaidUser } from "@/lib/auth";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";

export default async function DashboardPage() {
  await requirePaidUser();
  return <DashboardOverview />;
}
