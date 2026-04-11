import { NextResponse } from "next/server";
import { createAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function checkDatabase(): Promise<{
  ok: boolean;
  latencyMs: number | null;
  error?: string;
}> {
  if (!hasSupabaseAdminEnv()) {
    return {
      ok: false,
      latencyMs: null,
      error: "Variáveis de ambiente do Supabase não configuradas.",
    };
  }

  const start = Date.now();
  try {
    const client = createAdminClient();
    // Faz uma query leve para verificar se o banco está respondendo
    const { error } = await client
      .from("profiles")
      .select("id")
      .limit(1)
      .maybeSingle();

    const latencyMs = Date.now() - start;

    if (error) {
      return { ok: false, latencyMs, error: error.message };
    }

    return { ok: true, latencyMs };
  } catch (err) {
    const latencyMs = Date.now() - start;
    const message =
      err instanceof Error ? err.message : "Erro desconhecido ao conectar.";
    return { ok: false, latencyMs, error: message };
  }
}

export async function GET() {
  const db = await checkDatabase();

  const status = {
    status: db.ok ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    services: {
      database: {
        ok: db.ok,
        latencyMs: db.latencyMs,
        ...(db.error ? { error: db.error } : {}),
      },
    },
  };

  return NextResponse.json(status, {
    status: db.ok ? 200 : 503,
    headers: {
      // Nunca cachear — sempre verificar em tempo real
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
