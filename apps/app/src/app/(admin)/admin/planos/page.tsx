import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { TABLES } from "@repo/db";
import { PlanosClient } from "./planos-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Planos | Admin" };

export default async function PlanosPage() {
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
