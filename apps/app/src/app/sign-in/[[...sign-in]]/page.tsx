import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignIn } from "@clerk/nextjs";
import { hasAppEnv } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "Entrar | Plataforma do Professor",
};

export default function SignInPage() {
  if (!hasAppEnv()) {
    redirect("/setup");
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted p-4">
      <SignIn
        path="/sign-in"
        routing="path"
        withSignUp={false}
        forceRedirectUrl="/dashboard"
      />
    </main>
  );
}
