import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasAppEnv } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "Aceitar Convite | Plataforma do Professor",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function appendClerkParams(
  searchParams: Record<string, string | string[] | undefined>,
) {
  const nextParams = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (!key.startsWith("__clerk_")) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const entry of value) {
        nextParams.append(key, entry);
      }
      continue;
    }

    if (value) {
      nextParams.set(key, value);
    }
  }

  return nextParams;
}

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  if (!hasAppEnv()) {
    redirect("/setup");
  }

  const params = appendClerkParams(await searchParams);
  const ticket =
    params.get("__clerk_ticket") ?? params.get("__clerk_invitation_token");

  if (!ticket) {
    redirect("/sign-in");
  }

  redirect(`/sign-up?${params.toString()}`);
}
