"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentAppSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { asSupabaseInsert } from "@/lib/supabase/typed";
import { TABLES } from "@repo/db";
import { ROUTES } from "@/lib/routes";
import { ROLES } from "@/lib/supabase/env";

const createMaterialSchema = z.object({
  title: z.string().trim().min(1, "Informe o título"),
  description: z.string().trim(),
  filePath: z.string().trim().min(1, "Envie um arquivo para o material"),
  subject: z.string().trim(),
  gradeLevel: z.string().trim(),
});

export async function createMaterial(input: unknown) {
  const values = createMaterialSchema.safeParse(input);

  if (!values.success) {
    return {
      ok: false,
      error: "Dados inválidos para criar o material.",
    } as const;
  }

  const session = await getCurrentAppSession();

  if (
    !session ||
    (session.profile.role !== ROLES.ADMIN &&
      session.profile.role !== ROLES.PROFESSOR)
  ) {
    return {
      ok: false,
      error: "Apenas professores e administradores podem criar materiais.",
    } as const;
  }

  const { error } = await createAdminClient()
    .from(TABLES.MATERIAIS)
    .insert(
      asSupabaseInsert<"materiais">({
        title: values.data.title,
        description: values.data.description || null,
        file_url: values.data.filePath,
        subject: values.data.subject || null,
        grade_level: values.data.gradeLevel || null,
      }),
    );

  if (error) {
    return { ok: false, error: "Não foi possível criar o material." } as const;
  }

  revalidatePath(ROUTES.ADMIN.MATERIAIS);
  revalidatePath(ROUTES.ALUNO.MATERIAIS);

  return { ok: true, message: "Material criado." } as const;
}
