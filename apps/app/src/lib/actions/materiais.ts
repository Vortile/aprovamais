"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentAppSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { asSupabaseInsert } from "@/lib/supabase/typed";

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

  if (!session || session.profile.role !== "admin") {
    return {
      ok: false,
      error: "Apenas administradores podem criar materiais.",
    } as const;
  }

  const { error } = await createAdminClient()
    .from("materiais")
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

  revalidatePath("/admin/materiais");
  revalidatePath("/aluno/materiais");

  return { ok: true, message: "Material criado." } as const;
}
