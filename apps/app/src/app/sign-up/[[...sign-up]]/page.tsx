import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignUp } from "@clerk/nextjs";
import { hasAppEnv } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "Convite | Plataforma do Professor",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  if (!hasAppEnv()) {
    redirect("/setup");
  }

  const params = await searchParams;
  const ticket =
    getSearchValue(params.__clerk_ticket) ??
    getSearchValue(params.__clerk_invitation_token);

  if (!ticket) {
    redirect("/sign-in");
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted p-4">
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        forceRedirectUrl="/dashboard"
      />
    </main>
  );
}
