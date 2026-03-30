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
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function hasClerkEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
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

export function getClerkRole(value: unknown): "admin" | "aluno" | null {
  return value === "admin" || value === "aluno" ? value : null;
}

export function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? null;
}

