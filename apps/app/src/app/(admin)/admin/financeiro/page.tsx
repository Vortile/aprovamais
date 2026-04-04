import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { TABLES } from "@repo/db";
import { FinanceiroClient } from "./financeiro-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Financeiro | Admin" };

export default async function FinanceiroPage() {
  const supabase = createAdminClient();

  const [{ data: registros }, { data: planos }, { data: alunos }] =
    await Promise.all([
      supabase
        .from(TABLES.FINANCEIRO)
        .select("*, alunos(grade, plan_id, profiles(full_name))")
        .order("due_date", { ascending: false }),
      supabase
        .from(TABLES.PLANOS)
        .select("*")
        .order("active", { ascending: false })
        .order("monthly_amount", { ascending: true }),
      supabase
        .from(TABLES.ALUNOS)
        .select("id, plan_id, profiles(full_name)")
        .order("created_at", { ascending: false }),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Financeiro</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Acompanhe os pagamentos e a projeção mensal baseada nos planos ativos.
        </p>
      </div>
      <FinanceiroClient
        registros={registros ?? []}
        planos={planos ?? []}
        alunos={alunos ?? []}
      />
    </div>
  );
}
