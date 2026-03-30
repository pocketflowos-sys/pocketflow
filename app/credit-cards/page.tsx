import { requirePaidUser } from "@/lib/auth";
import { CreditCardsPage } from "@/components/credit-cards/credit-cards-page";

export default async function CreditCardsRoute() {
  await requirePaidUser();
  return <CreditCardsPage />;
}
