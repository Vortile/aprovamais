import { redirect } from "next/navigation";
import { requireAppSession } from "@/lib/auth/session";
import { hasAppEnv, ROLES } from "@/lib/supabase/env";
import { ROUTES } from "@/lib/routes";

export default async function DashboardPage() {
  if (!hasAppEnv()) {
    redirect(ROUTES.SETUP);
  }

  const session = await requireAppSession();
  const role = session.profile.role;

  if (role === ROLES.ADMIN || role === ROLES.PROFESSOR) {
    redirect(ROUTES.ADMIN.ALUNOS);
  }

  redirect(ROUTES.ALUNO.MATERIAIS);
}
