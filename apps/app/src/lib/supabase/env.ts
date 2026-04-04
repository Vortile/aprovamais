export function getSupabasePublishableKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    ""
  );
}

export function hasSupabaseDatabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function hasClerkEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY,
  );
}

export function hasAppEnv() {
  return Boolean(hasSupabaseDatabaseEnv() && hasClerkEnv());
}

export function hasSupabaseEnv() {
  return hasSupabaseDatabaseEnv();
}

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export type AppRole = "admin" | "professor" | "aluno";

export const ROLES = {
  ADMIN: "admin" as AppRole,
  PROFESSOR: "professor" as AppRole,
  ALUNO: "aluno" as AppRole,
} as const;

/**
 * Derive an app role from Clerk metadata.
 * privateMetadata is server-only and authoritative.
 * publicMetadata is a fallback used for not-yet-activated invitation hints.
 */
export function getRoleFromMetadata(
  privateMetadata: unknown,
  publicMetadata?: unknown,
): AppRole {
  const check = (v: unknown): AppRole | null => {
    if (v === "admin" || v === "professor" || v === "aluno") return v;
    return null;
  };
  if (privateMetadata && typeof privateMetadata === "object") {
    const r = check((privateMetadata as Record<string, unknown>).role);
    if (r) return r;
  }
  if (publicMetadata && typeof publicMetadata === "object") {
    const r = check((publicMetadata as Record<string, unknown>).role);
    if (r) return r;
  }
  return "aluno";
}

export function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? null;
}
