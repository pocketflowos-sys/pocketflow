import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { AccessStatus } from "@/lib/types";
import { getSafeInternalRedirect } from "@/lib/app-url";

function resolveAuthRedirect(requestedNext: string, accessStatus: AccessStatus | null | undefined) {
  if (requestedNext !== "/dashboard") {
    return requestedNext;
  }

  if (accessStatus === "active") {
    return "/dashboard";
  }

  return "/checkout";
}

function buildRedirectResponse(url: URL, source?: NextResponse) {
  const response = NextResponse.redirect(url);

  if (source) {
    for (const cookie of source.cookies.getAll()) {
      response.cookies.set(cookie);
    }
  }

  return response;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const requestedNext = getSafeInternalRedirect(requestUrl.searchParams.get("next"), "/dashboard");

  let response = buildRedirectResponse(
    new URL(
      "/login?message=We%20could%20not%20complete%20Google%20sign%20in.%20Please%20try%20again.",
      requestUrl.origin
    )
  );

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    {
      cookies: {
        get(name: string) {
          return request.headers
            .get("cookie")
            ?.split(";")
            .map((value) => value.trim())
            .find((value) => value.startsWith(`${name}=`))
            ?.slice(name.length + 1);
        },
        set(name: string, value: string, options) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options) {
          response.cookies.set({ name, value: "", ...options, maxAge: 0 });
        }
      }
    }
  );

  if (!code) {
    return response;
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return response;
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return response;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("access_status")
    .eq("id", user.id)
    .maybeSingle();

  const finalPath = resolveAuthRedirect(requestedNext, (profile?.access_status ?? null) as AccessStatus | null);
  return buildRedirectResponse(new URL(finalPath, requestUrl.origin), response);
}
