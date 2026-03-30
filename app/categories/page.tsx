import { requirePaidUser } from "@/lib/auth";
import { CategoriesPage } from "@/components/categories/categories-page";

export default async function CategoriesRoute() {
  await requirePaidUser();
  return <CategoriesPage />;
}
