"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import type { Database } from "@repo/db";
import { getCurrentAppSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClerkRole, normalizeEmail } from "@/lib/supabase/env";
import { asSupabaseInsert, asSupabaseUpdate } from "@/lib/supabase/typed";

const saveAlunoSchema = z.object({
  alunoId: z.string().uuid().optional(),
  fullName: z.string().trim(),
  contactEmail: z
    .string()
    .trim()
    .email("Informe um email válido")
    .or(z.literal("")),
  planId: z.string().uuid("Selecione um plano"),
  grade: z.string().trim().min(1, "Informe a série"),
  subjectFocus: z.string().trim(),
  notes: z.string().trim(),
});

const alunoIdSchema = z.string().uuid();

type SaveAlunoResult =
  | { ok: true; message: string }
  | { ok: false; error: string };
type DeleteAlunoResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type AlunoRow = Database["public"]["Tables"]["alunos"]["Row"];
type AlunoWithProfileRow = Pick<
  AlunoRow,
  "id" | "profile_id" | "plan_id" | "contact_email"
> & {
  profiles: Pick<
    ProfileRow,
    "id" | "clerk_user_id" | "email" | "full_name" | "role"
  > | null;
};
type ClerkUserRecord = {
  id: string;
  primaryEmailAddressId: string | null;
  publicMetadata: Record<string, unknown>;
  emailAddresses: Array<{
    id: string;
    emailAddress: string;
  }>;
};

async function assertAdminAccess() {
  const session = await getCurrentAppSession();

  if (!session) {
    return { error: "Sua sessão expirou. Entre novamente." } as const;
  }

  if (session.profile.role !== "admin") {
    return {
      error: "Apenas administradores podem gerenciar contas de alunos.",
    } as const;
  }

  return { session } as const;
}

function splitFullName(fullName: string | null) {
  if (!fullName) {
    return {};
  }

  const parts = fullName.split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return {};
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" ") || undefined,
  };
}

function getPrimaryEmail(user: ClerkUserRecord) {
  const primaryEmail = user.emailAddresses.find(
    (email) => email.id === user.primaryEmailAddressId,
  );

  return normalizeEmail(
    primaryEmail?.emailAddress ?? user.emailAddresses[0]?.emailAddress,
  );
}

function isAlunoRole(value: unknown) {
  return getClerkRole(value) === "aluno";
}

async function getAppOrigin() {
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");

  if (origin) {
    return origin;
  }

  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  if (host) {
    return `${protocol}://${host}`;
  }

  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

async function findAluno(alunoId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("alunos")
    .select(
      "id, profile_id, plan_id, contact_email, profiles(id, clerk_user_id, email, full_name, role)",
    )
    .eq("id", alunoId)
    .single();

  if (error) {
    return null;
  }

  return data as AlunoWithProfileRow | null;
}

async function findProfileByEmail(normalizedEmail: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .ilike("email", normalizedEmail)
    .limit(1);

  return (data?.[0] as ProfileRow | undefined) ?? null;
}

async function findProfileByClerkUserId(clerkUserId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .limit(1);

  return (data?.[0] as ProfileRow | undefined) ?? null;
}

async function upsertAlunoProfile({
  currentProfileId,
  normalizedEmail,
  fullName,
  clerkUserId,
}: {
  currentProfileId: string | null;
  normalizedEmail: string;
  fullName: string | null;
  clerkUserId: string | null;
}) {
  const supabase = createAdminClient();

  if (currentProfileId) {
    const { data, error } = await supabase
      .from("profiles")
      .update(
        asSupabaseUpdate<"profiles">({
          clerk_user_id: clerkUserId,
          email: normalizedEmail,
          full_name: fullName,
          role: "aluno",
        }),
      )
      .eq("id", currentProfileId)
      .select("*")
      .single();

    if (error || !data) {
      return null;
    }

    return data as ProfileRow;
  }

  const byClerkUser = clerkUserId
    ? await findProfileByClerkUserId(clerkUserId)
    : null;
  const byEmail = byClerkUser
    ? null
    : await findProfileByEmail(normalizedEmail);
  const existingProfile = byClerkUser ?? byEmail;

  if (existingProfile) {
    const { data, error } = await supabase
      .from("profiles")
      .update(
        asSupabaseUpdate<"profiles">({
          clerk_user_id: clerkUserId,
          email: normalizedEmail,
          full_name: fullName,
          role: "aluno",
        }),
      )
      .eq("id", existingProfile.id)
      .select("*")
      .single();

    if (error || !data) {
      return null;
    }

    return data as ProfileRow;
  }

  const { data, error } = await supabase
    .from("profiles")
    .insert(
      asSupabaseInsert<"profiles">({
        id: crypto.randomUUID(),
        clerk_user_id: clerkUserId,
        email: normalizedEmail,
        full_name: fullName,
        role: "aluno",
      }),
    )
    .select("*")
    .single();

  if (error || !data) {
    return null;
  }

  return data as ProfileRow;
}

async function findClerkUserByEmail(normalizedEmail: string) {
  const client = await clerkClient();
  const response = await client.users.getUserList({
    emailAddress: [normalizedEmail],
    limit: 1,
  });

  return (response.data[0] as ClerkUserRecord | undefined) ?? null;
}

async function getClerkUser(userId: string) {
  try {
    return (await (
      await clerkClient()
    ).users.getUser(userId)) as unknown as ClerkUserRecord;
  } catch {
    return null;
  }
}

async function syncClerkUser({
  user,
  normalizedEmail,
  fullName,
}: {
  user: ClerkUserRecord;
  normalizedEmail: string;
  fullName: string | null;
}) {
  const client = await clerkClient();

  if (getPrimaryEmail(user) !== normalizedEmail) {
    const existingAddress = user.emailAddresses.find(
      (address) => normalizeEmail(address.emailAddress) === normalizedEmail,
    );

    if (existingAddress) {
      await client.emailAddresses.updateEmailAddress(existingAddress.id, {
        verified: true,
        primary: true,
      });
    } else {
      await client.emailAddresses.createEmailAddress({
        userId: user.id,
        emailAddress: normalizedEmail,
        verified: true,
        primary: true,
      });
    }
  }

  await client.users.updateUser(user.id, {
    ...splitFullName(fullName),
    publicMetadata: {
      ...user.publicMetadata,
      role: "aluno",
    },
  });
}

async function revokePendingInvitations(normalizedEmail: string) {
  const client = await clerkClient();
  const invitations = await client.invitations.getInvitationList({
    query: normalizedEmail,
    limit: 100,
  });

  await Promise.all(
    invitations.data
      .filter(
        (invitation) =>
          normalizeEmail(invitation.emailAddress) === normalizedEmail &&
          invitation.status === "pending",
      )
      .map((invitation) => client.invitations.revokeInvitation(invitation.id)),
  );
}

async function createAlunoInvitation(
  normalizedEmail: string,
  fullName: string | null,
) {
  const client = await clerkClient();

  await revokePendingInvitations(normalizedEmail);

  await client.invitations.createInvitation({
    emailAddress: normalizedEmail,
    ignoreExisting: true,
    notify: true,
    publicMetadata: {
      role: "aluno",
      ...(fullName ? { full_name: fullName } : {}),
    },
    redirectUrl: `${await getAppOrigin()}/sign-up`,
  });
}

function getSubjectList(subjectFocus: string) {
  return subjectFocus
    .split(",")
    .map((subject) => subject.trim())
    .filter(Boolean);
}

export async function saveAluno(input: unknown): Promise<SaveAlunoResult> {
  const values = saveAlunoSchema.safeParse(input);

  if (!values.success) {
    return { ok: false, error: "Dados inválidos para salvar o aluno." };
  }

  const adminAccess = await assertAdminAccess();

  if ("error" in adminAccess) {
    return {
      ok: false,
      error: adminAccess.error ?? "Acesso administrativo inválido.",
    };
  }

  const normalizedEmail = normalizeEmail(values.data.contactEmail);
  const fullName = values.data.fullName || null;
  const planId = values.data.planId;
  const subjectFocus = getSubjectList(values.data.subjectFocus);
  const supabase = createAdminClient();

  let currentAluno: AlunoWithProfileRow | null = null;

  if (values.data.alunoId) {
    currentAluno = await findAluno(values.data.alunoId);

    if (!currentAluno) {
      return { ok: false, error: "Aluno não encontrado para edição." };
    }

    if (currentAluno.profile_id && !normalizedEmail) {
      return {
        ok: false,
        error: "Informe o email da conta vinculada para continuar.",
      };
    }
  }

  let profileId = currentAluno?.profile_id ?? null;
  let successMessage = values.data.alunoId
    ? "Aluno atualizado."
    : "Aluno criado.";

  if (normalizedEmail) {
    const emailProfile = await findProfileByEmail(normalizedEmail);

    if (
      emailProfile &&
      emailProfile.role !== "aluno" &&
      emailProfile.id !== currentAluno?.profile_id
    ) {
      return {
        ok: false,
        error: "Este email já pertence a uma conta que não é de aluno.",
      };
    }

    const currentClerkUser = currentAluno?.profiles?.clerk_user_id
      ? await getClerkUser(currentAluno.profiles.clerk_user_id)
      : null;
    const matchedClerkUser = await findClerkUserByEmail(normalizedEmail);

    if (
      matchedClerkUser &&
      currentClerkUser &&
      matchedClerkUser.id !== currentClerkUser.id
    ) {
      return {
        ok: false,
        error: "Já existe outra conta Clerk usando este email.",
      };
    }

    if (
      matchedClerkUser &&
      !isAlunoRole(matchedClerkUser.publicMetadata.role)
    ) {
      return {
        ok: false,
        error: "Este email já pertence a uma conta que não é de aluno.",
      };
    }

    const clerkUser = currentClerkUser ?? matchedClerkUser;

    if (clerkUser) {
      await syncClerkUser({ user: clerkUser, normalizedEmail, fullName });
    } else {
      await createAlunoInvitation(normalizedEmail, fullName);
    }

    const profile = await upsertAlunoProfile({
      currentProfileId: currentAluno?.profile_id ?? null,
      normalizedEmail,
      fullName,
      clerkUserId: clerkUser?.id ?? null,
    });

    if (!profile) {
      return {
        ok: false,
        error:
          "Não foi possível preparar o perfil do aluno para a conta informada.",
      };
    }

    profileId = profile.id;

    if (clerkUser && currentAluno?.profile_id) {
      successMessage = "Conta do aluno atualizada.";
    } else if (clerkUser) {
      successMessage = "Conta existente vinculada ao aluno.";
    } else {
      successMessage = "Convite enviado e conta vinculada ao aluno.";
    }
  } else if (currentAluno?.profile_id) {
    const { error } = await supabase
      .from("profiles")
      .update(
        asSupabaseUpdate<"profiles">({
          full_name: fullName,
        }),
      )
      .eq("id", currentAluno.profile_id);

    if (error) {
      return {
        ok: false,
        error: "Não foi possível atualizar o perfil do aluno.",
      };
    }
  }

  if (values.data.alunoId) {
    const { error } = await supabase
      .from("alunos")
      .update(
        asSupabaseUpdate<"alunos">({
          profile_id: profileId,
          plan_id: planId,
          contact_email: normalizedEmail,
          grade: values.data.grade,
          subject_focus: subjectFocus,
          notes: values.data.notes,
        }),
      )
      .eq("id", values.data.alunoId);

    if (error) {
      return { ok: false, error: "Não foi possível atualizar o aluno." };
    }
  } else {
    const { error } = await supabase.from("alunos").insert(
      asSupabaseInsert<"alunos">({
        profile_id: profileId,
        plan_id: planId,
        contact_email: normalizedEmail,
        grade: values.data.grade,
        subject_focus: subjectFocus,
        notes: values.data.notes,
      }),
    );

    if (error) {
      return { ok: false, error: "Não foi possível criar o aluno." };
    }
  }

  revalidatePath("/admin/alunos");
  return { ok: true, message: successMessage };
}

export async function deleteAluno(alunoId: string): Promise<DeleteAlunoResult> {
  if (!alunoIdSchema.safeParse(alunoId).success) {
    return { ok: false, error: "Aluno inválido para exclusão." };
  }

  const adminAccess = await assertAdminAccess();

  if ("error" in adminAccess) {
    return {
      ok: false,
      error: adminAccess.error ?? "Acesso administrativo inválido.",
    };
  }

  const aluno = await findAluno(alunoId);

  if (!aluno) {
    return { ok: false, error: "Aluno não encontrado." };
  }

  const supabase = createAdminClient();

  try {
    if (aluno.profiles?.clerk_user_id) {
      await (
        await clerkClient()
      ).users.deleteUser(aluno.profiles.clerk_user_id);
    } else if (aluno.contact_email) {
      const normalizedEmail = normalizeEmail(aluno.contact_email);

      if (normalizedEmail) {
        await revokePendingInvitations(normalizedEmail);
      }
    }
  } catch {
    return {
      ok: false,
      error: "Não foi possível excluir a conta vinculada do aluno.",
    };
  }

  const { error: deleteAlunoError } = await supabase
    .from("alunos")
    .delete()
    .eq("id", alunoId);

  if (deleteAlunoError) {
    return {
      ok: false,
      error: "Não foi possível excluir o cadastro do aluno.",
    };
  }

  if (aluno.profile_id) {
    await supabase.from("profiles").delete().eq("id", aluno.profile_id);
  }

  revalidatePath("/admin/alunos");

  return {
    ok: true,
    message: aluno.profile_id
      ? "Aluno e conta vinculada excluídos."
      : "Aluno excluído.",
  };
}
