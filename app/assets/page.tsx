import { requirePaidUser } from "@/lib/auth";
import { AssetsPage } from "@/components/assets/assets-page";

export default async function AssetsRoute() {
  await requirePaidUser();
  return <AssetsPage />;
}
