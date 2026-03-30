import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasAppEnv } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "Entrar | Plataforma do Professor",
};

export default function LoginPage() {
  if (!hasAppEnv()) {
    redirect("/setup");
  }

  redirect("/sign-in");
}
