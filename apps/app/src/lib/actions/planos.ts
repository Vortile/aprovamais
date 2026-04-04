"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentAppSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { asSupabaseInsert, asSupabaseUpdate } from "@/lib/supabase/typed";
import { TABLES } from "@repo/db";
import { ROUTES } from "@/lib/routes";
import { ROLES } from "@/lib/supabase/env";
import { ACTION_ERRORS } from "@/lib/errors";

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

const planoSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do plano"),
  badge: z.string().trim(),
  monthlyAmount: monthlyAmountSchema,
  billingDay: billingDaySchema,
  description: z.string().trim(),
  features: z.array(z.string().trim()).default([]),
  isFeatured: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  active: z.boolean().default(true),
});

async function assertAdmin() {
  const session = await getCurrentAppSession();
  if (!session || session.profile.role !== ROLES.ADMIN) {
    return null;
  }
  return session;
}

function revalidatePlanos() {
  revalidatePath(ROUTES.ADMIN.PLANOS);
  revalidatePath(ROUTES.ADMIN.FINANCEIRO);
  revalidatePath(ROUTES.ADMIN.ALUNOS);
}

export async function savePlano(input: unknown) {
  const values = planoSchema.safeParse(input);

  if (!values.success) {
    return { ok: false, error: "Dados inválidos para criar o plano." } as const;
  }

  const session = await assertAdmin();
  if (!session) {
    return {
      ok: false,
      error: "Apenas administradores podem criar planos.",
    } as const;
  }

  const { error } = await createAdminClient()
    .from(TABLES.PLANOS)
    .insert(
      asSupabaseInsert<"planos">({
        name: values.data.name,
        badge: values.data.badge || null,
        monthly_amount: values.data.monthlyAmount,
        billing_day: values.data.billingDay,
        description: values.data.description || null,
        features: values.data.features.filter(Boolean),
        is_featured: values.data.isFeatured,
        sort_order: values.data.sortOrder,
        active: values.data.active,
      }),
    );

  if (error) {
    return { ok: false, error: "Não foi possível criar o plano." } as const;
  }

  revalidatePlanos();
  return { ok: true, message: "Plano criado." } as const;
}

export async function updatePlano(id: string, input: unknown) {
  const values = planoSchema.safeParse(input);

  if (!values.success) {
    return { ok: false, error: "Dados inválidos." } as const;
  }

  const session = await assertAdmin();
  if (!session) {
    return {
      ok: false,
      error: "Apenas administradores podem editar planos.",
    } as const;
  }

  const { error } = await createAdminClient()
    .from(TABLES.PLANOS)
    .update(
      asSupabaseUpdate<"planos">({
        name: values.data.name,
        badge: values.data.badge || null,
        monthly_amount: values.data.monthlyAmount,
        billing_day: values.data.billingDay,
        description: values.data.description || null,
        features: values.data.features.filter(Boolean),
        is_featured: values.data.isFeatured,
        sort_order: values.data.sortOrder,
        active: values.data.active,
      }),
    )
    .eq("id", id);

  if (error) {
    return { ok: false, error: "Não foi possível atualizar o plano." } as const;
  }

  revalidatePlanos();
  return { ok: true, message: "Plano atualizado." } as const;
}

export async function deletePlano(id: string) {
  const session = await assertAdmin();
  if (!session) {
    return { ok: false, error: ACTION_ERRORS.NO_PERMISSION } as const;
  }

  const { error } = await createAdminClient()
    .from(TABLES.PLANOS)
    .delete()
    .eq("id", id);

  if (error) {
    return {
      ok: false,
      error: "Não foi possível excluir. Verifique se há alunos vinculados.",
    } as const;
  }

  revalidatePlanos();
  return { ok: true, message: "Plano excluído." } as const;
}
