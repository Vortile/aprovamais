"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentAppSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { asSupabaseInsert } from "@/lib/supabase/typed";
import { MATERIALS_BUCKET, getMaterialStoragePath } from "@/lib/materials";
import { TABLES, type Database } from "@repo/db";
import { ROUTES } from "@/lib/routes";
import { ROLES } from "@/lib/supabase/env";
import { ACTION_ERRORS } from "@/lib/errors";

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

const deleteMaterialSchema = z.string().uuid();

export async function deleteMaterial(
  materialId: unknown,
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  if (!deleteMaterialSchema.safeParse(materialId).success) {
    return { ok: false, error: "Material inválido para exclusão." };
  }

  const session = await getCurrentAppSession();

  if (
    !session ||
    (session.profile.role !== ROLES.ADMIN &&
      session.profile.role !== ROLES.PROFESSOR)
  ) {
    return { ok: false, error: ACTION_ERRORS.NO_PERMISSION };
  }

  const supabase = createAdminClient();

  // Fetch the row first so we know the storage path
  const { data: materialRaw, error: fetchError } = await supabase
    .from(TABLES.MATERIAIS)
    .select("id, file_url")
    .eq("id", materialId as string)
    .maybeSingle();

  type MaterialRow = Pick<
    Database["public"]["Tables"]["materiais"]["Row"],
    "id" | "file_url"
  >;

  const material = materialRaw as MaterialRow | null;

  if (fetchError || !material) {
    return { ok: false, error: "Material não encontrado." };
  }

  // Delete from storage first, best-effort
  const storagePath = getMaterialStoragePath(material.file_url);

  if (storagePath) {
    const { error: storageError } = await supabase.storage
      .from(MATERIALS_BUCKET)
      .remove([storagePath]);

    if (storageError) {
      return {
        ok: false,
        error: "Não foi possível excluir o arquivo do armazenamento.",
      };
    }
  }

  // Delete the database row
  const { error: dbError } = await supabase
    .from(TABLES.MATERIAIS)
    .delete()
    .eq("id", material.id);

  if (dbError) {
    return { ok: false, error: "Não foi possível excluir o material." };
  }

  revalidatePath(ROUTES.ADMIN.MATERIAIS);
  revalidatePath(ROUTES.ALUNO.MATERIAIS);

  return { ok: true, message: "Material excluído." };
}
