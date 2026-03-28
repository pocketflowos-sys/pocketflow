import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { AccessStatus, Profile } from "@/lib/types";

export async function getCurrentProfile() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null as Profile | null };
  }

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, preferred_currency, access_status, paid_at")
    .eq("id", user.id)
    .maybeSingle();

  const profile: Profile | null = data
    ? {
        id: data.id,
        fullName: data.full_name ?? "",
        email: data.email ?? user.email ?? "",
        preferredCurrency: data.preferred_currency ?? "INR",
        accessStatus: (data.access_status ?? "pending") as AccessStatus,
        paidAt: data.paid_at
      }
    : null;

  return { user, profile };
}

export async function requireUser(redirectTo = "/login") {
  const { user, profile } = await getCurrentProfile();
  if (!user) redirect(redirectTo);
  return { user, profile };
}

export async function requirePaidUser() {
  const { user, profile } = await requireUser();
  if (!profile || profile.accessStatus !== "active") {
    redirect("/checkout");
  }
  return { user, profile };
}
