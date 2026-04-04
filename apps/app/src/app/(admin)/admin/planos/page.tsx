import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAppSession } from "@/lib/auth/session";
import { ROLES } from "@/lib/supabase/env";
import { ROUTES } from "@/lib/routes";
import { TABLES } from "@repo/db";
import { PlanosClient } from "./planos-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Planos | Admin" };

export default async function PlanosPage() {
  const session = await getCurrentAppSession();
  if (!session || session.profile.role !== ROLES.ADMIN) {
    redirect(ROUTES.ADMIN.ALUNOS);
  }
  const { data: planos } = await createAdminClient()
    .from(TABLES.PLANOS)
    .select("*")
    .order("sort_order", { ascending: true })
    .order("monthly_amount", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Planos</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gerencie os planos exibidos no site e vinculados aos alunos.
        </p>
      </div>
      <PlanosClient planos={planos ?? []} />
    </div>
  );
}
