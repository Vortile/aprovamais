import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { AlunosClient } from "./alunos-client";

export const metadata: Metadata = { title: "Alunos | Admin" };

export default async function AlunosPage() {
  const supabase = createAdminClient();

  const [{ data: alunos }, { data: planos }] = await Promise.all([
    supabase
      .from("alunos")
      .select(
        "*, profiles(full_name, avatar_url), planos(name, monthly_amount, active)",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("planos")
      .select("*")
      .order("active", { ascending: false })
      .order("monthly_amount", { ascending: true }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Alunos</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gerencie os alunos cadastrados na plataforma.
        </p>
      </div>
      <AlunosClient alunos={alunos ?? []} planos={planos ?? []} />
    </div>
  );
}
