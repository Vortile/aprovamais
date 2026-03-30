import "server-only";

import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import type { Database } from "@repo/db";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClerkRole, normalizeEmail } from "@/lib/supabase/env";
import { asSupabaseInsert, asSupabaseUpdate } from "@/lib/supabase/typed";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type AppRole = ProfileRow["role"];

export type AppSession = {
  clerkUserId: string;
  email: string;
  name: string | null;
  profile: ProfileRow;
};

function getPrimaryEmail(
  user: NonNullable<Awaited<ReturnType<typeof currentUser>>>,
) {
  const primaryEmail = user.emailAddresses.find(
    (email) => email.id === user.primaryEmailAddressId,
  );

  return normalizeEmail(
    primaryEmail?.emailAddress ?? user.emailAddresses[0]?.emailAddress,
  );
}

function getDisplayName(
  user: NonNullable<Awaited<ReturnType<typeof currentUser>>>,
) {
  const fullName = [user.firstName, user.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || user.username || getPrimaryEmail(user);
}

async function findProfileByClerkOrEmail(
  clerkUserId: string,
  normalizedEmail: string | null,
) {
  const supabase = createAdminClient();

  const { data: byClerkRows } = await supabase
    .from("profiles")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .limit(1);

  const byClerk = (byClerkRows?.[0] as ProfileRow | undefined) ?? null;

  if (byClerk || !normalizedEmail) {
    return byClerk;
  }

  const { data: byEmailRows } = await supabase
    .from("profiles")
    .select("*")
    .ilike("email", normalizedEmail)
    .limit(1);

  return (byEmailRows?.[0] as ProfileRow | undefined) ?? null;
}

async function inferRole(normalizedEmail: string | null) {
  const supabase = createAdminClient();

  if (normalizedEmail) {
    const { data: alunosRows } = await supabase
      .from("alunos")
      .select("id")
      .ilike("contact_email", normalizedEmail)
      .limit(1);

    if ((alunosRows?.length ?? 0) > 0) {
      return "aluno" satisfies AppRole;
    }
  }

  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");

  return count === 0
    ? ("admin" satisfies AppRole)
    : ("aluno" satisfies AppRole);
}

async function linkAlunoProfile(
  profileId: string,
  normalizedEmail: string | null,
) {
  if (!normalizedEmail) {
    return;
  }

  const supabase = createAdminClient();

  await supabase
    .from("alunos")
    .update(
      asSupabaseUpdate<"alunos">({
        profile_id: profileId,
      }),
    )
    .ilike("contact_email", normalizedEmail)
    .is("profile_id", null);
}

export async function getCurrentAppSession(): Promise<AppSession | null> {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const user = await currentUser();

  if (!user) {
    return null;
  }

  const email = getPrimaryEmail(user);

  if (!email) {
    return null;
  }

  const name = getDisplayName(user);
  const supabase = createAdminClient();
  let profile = await findProfileByClerkOrEmail(userId, email);

  if (profile) {
    const nextRole = getClerkRole(user.publicMetadata.role) ?? profile.role;
    const shouldUpdate =
      profile.clerk_user_id !== userId ||
      normalizeEmail(profile.email) !== email ||
      profile.full_name !== name ||
      profile.role !== nextRole;

    if (shouldUpdate) {
      const { data } = await supabase
        .from("profiles")
        .update(
          asSupabaseUpdate<"profiles">({
            clerk_user_id: userId,
            email,
            full_name: name,
            role: nextRole,
          }),
        )
        .eq("id", profile.id)
        .select("*")
        .single();

      profile = (data as ProfileRow | null) ?? profile;
    }
  } else {
    const role =
      getClerkRole(user.publicMetadata.role) ?? (await inferRole(email));
    const { data } = await supabase
      .from("profiles")
      .insert(
        asSupabaseInsert<"profiles">({
          id: crypto.randomUUID(),
          clerk_user_id: userId,
          email,
          full_name: name,
          role,
        }),
      )
      .select("*")
      .single();

    profile = data as ProfileRow | null;
  }

  if (!profile) {
    return null;
  }

  await linkAlunoProfile(profile.id, email);

  return {
    clerkUserId: userId,
    email,
    name,
    profile,
  };
}

export async function requireAppSession() {
  const session = await getCurrentAppSession();

  if (!session) {
    redirect("/sign-in");
  }

  return session;
}

export async function requireRole(role: AppRole) {
  const session = await requireAppSession();

  if (session.profile.role !== role) {
    redirect(role === "admin" ? "/aluno/materiais" : "/admin/alunos");
  }

  return session;
}
