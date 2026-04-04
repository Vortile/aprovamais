import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { ROLES } from "@/lib/supabase/env";
import { TABLES } from "@repo/db";
import { ProfessoresClient } from "./professores-client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Professores | Admin" };

export default async function ProfessoresPage() {
  await requireRole(ROLES.ADMIN);

  const supabase = createAdminClient();

  const { data: professores } = await supabase
    .from(TABLES.PROFILES)
    .select("*")
    .eq("role", ROLES.PROFESSOR)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Professores</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gerencie os professores com acesso à plataforma.
        </p>
      </div>
      <ProfessoresClient professores={professores ?? []} />
    </div>
  );
}
