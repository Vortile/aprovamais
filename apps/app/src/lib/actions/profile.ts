"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { asSupabaseUpdate } from "@/lib/supabase/typed";
import { TABLES } from "@repo/db";
import { ROUTES } from "@/lib/routes";
import { ACTION_ERRORS } from "@/lib/errors";

const updateProfileSchema = z.object({
  profileId: z.string().uuid(),
  fullName: z.string().trim().min(2, "Nome deve ter ao menos 2 caracteres"),
});

function splitFullName(fullName: string) {
  const parts = fullName.split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" ") || undefined,
  };
}

export async function updateOwnProfile(input: unknown) {
  const values = updateProfileSchema.safeParse(input);

  if (!values.success) {
    return {
      ok: false,
      error: "Dados inválidos para atualizar o perfil.",
    } as const;
  }

  const { userId } = await auth();

  if (!userId) {
    return {
      ok: false,
      error: ACTION_ERRORS.SESSION_EXPIRED,
    } as const;
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from(TABLES.PROFILES)
    .update(
      asSupabaseUpdate<"profiles">({
        full_name: values.data.fullName,
      }),
    )
    .eq("id", values.data.profileId);

  if (error) {
    return { ok: false, error: "Não foi possível salvar o perfil." } as const;
  }

  await (
    await clerkClient()
  ).users.updateUser(userId, {
    ...splitFullName(values.data.fullName),
  });

  revalidatePath(ROUTES.ADMIN.CONFIGURACOES);
  revalidatePath(ROUTES.DASHBOARD);

  return { ok: true, message: "Perfil atualizado." } as const;
}
