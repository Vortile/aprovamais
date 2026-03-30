import { redirect } from "next/navigation";
import { requireAppSession } from "@/lib/auth/session";
import { hasAppEnv } from "@/lib/supabase/env";

export default async function DashboardPage() {
  if (!hasAppEnv()) {
    redirect("/setup");
  }

  const session = await requireAppSession();
  const role = session.profile.role;

  if (role === "admin") {
    redirect("/admin/alunos");
  }

  redirect("/aluno/materiais");
}
