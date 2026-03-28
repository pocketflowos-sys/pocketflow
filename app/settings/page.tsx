import { requirePaidUser } from "@/lib/auth";
import { SettingsPage } from "@/components/settings/settings-page";

export default async function SettingsRoute() {
  await requirePaidUser();
  return <SettingsPage />;
}
