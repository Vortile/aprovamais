"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentAppSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { asSupabaseInsert } from "@/lib/supabase/typed";

const monthlyAmountSchema = z.preprocess((value) => {
  if (typeof value === "string") {
    return Number(value.replace(",", "."));
  }

  return value;
}, z.number().finite().positive("Informe um valor mensal maior que zero"));

const billingDaySchema = z.preprocess((value) => {
  if (value === "" || value == null) {
    return null;
  }

  if (typeof value === "string") {
    return Number(value);
  }

  return value;
}, z.number().int().min(1, "Informe um dia entre 1 e 31").max(31, "Informe um dia entre 1 e 31").nullable());

const savePlanoSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do plano"),
  monthlyAmount: monthlyAmountSchema,
  billingDay: billingDaySchema,
  description: z.string().trim(),
});

export async function savePlano(input: unknown) {
  const values = savePlanoSchema.safeParse(input);

  if (!values.success) {
    return { ok: false, error: "Dados inválidos para criar o plano." } as const;
  }

  const session = await getCurrentAppSession();

  if (!session || session.profile.role !== "admin") {
    return {
      ok: false,
      error: "Apenas administradores podem criar planos.",
    } as const;
  }

  const { error } = await createAdminClient()
    .from("planos")
    .insert(
      asSupabaseInsert<"planos">({
        name: values.data.name,
        monthly_amount: values.data.monthlyAmount,
        billing_day: values.data.billingDay,
        description: values.data.description || null,
        active: true,
      }),
    );

  if (error) {
    return { ok: false, error: "Não foi possível criar o plano." } as const;
  }

  revalidatePath("/admin/financeiro");
  revalidatePath("/admin/alunos");

  return { ok: true, message: "Plano criado." } as const;
}
