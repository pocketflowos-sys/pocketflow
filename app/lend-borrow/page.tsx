import { requirePaidUser } from "@/lib/auth";
import { LendBorrowPage } from "@/components/lend-borrow/lend-borrow-page";

export default async function LendBorrowRoute() {
  await requirePaidUser();
  return <LendBorrowPage />;
}
