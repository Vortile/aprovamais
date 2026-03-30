import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { ConfiguracoesClient } from "./configuracoes-client";

export const metadata: Metadata = { title: "Configurações | Admin" };

export default async function ConfiguracoesPage() {
  const session = await requireRole("admin");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gerencie seu perfil e preferências.
        </p>
      </div>
      <ConfiguracoesClient
        user={{
          id: session.profile.id,
          email: session.email,
          profile: session.profile,
        }}
      />
    </div>
  );
}
