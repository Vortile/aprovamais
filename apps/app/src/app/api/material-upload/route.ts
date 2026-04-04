import { NextResponse } from "next/server";
import { getCurrentAppSession } from "@/lib/auth/session";
import { MATERIALS_BUCKET, sanitizeStorageFileName } from "@/lib/materials";
import { createAdminClient } from "@/lib/supabase/admin";
import { ROLES } from "@/lib/supabase/env";

export async function POST(request: Request) {
  const session = await getCurrentAppSession();

  if (
    !session ||
    (session.profile.role !== ROLES.ADMIN &&
      session.profile.role !== ROLES.PROFESSOR)
  ) {
    return NextResponse.json(
      { ok: false, error: "Apenas administradores podem enviar materiais." },
      { status: 403 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: "Selecione um arquivo válido." },
      { status: 400 },
    );
  }

  if (file.size === 0) {
    return NextResponse.json(
      { ok: false, error: "O arquivo está vazio." },
      { status: 400 },
    );
  }

  const extension = file.name.includes(".")
    ? file.name.slice(file.name.lastIndexOf("."))
    : "";
  const baseName = extension
    ? file.name.slice(0, -extension.length)
    : file.name;
  const safeName = `${Date.now()}-${crypto.randomUUID()}-${sanitizeStorageFileName(baseName)}${extension.toLowerCase()}`;
  const path = `materiais/${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await createAdminClient()
    .storage.from(MATERIALS_BUCKET)
    .upload(path, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    return NextResponse.json(
      { ok: false, error: "Não foi possível enviar o arquivo para o Storage." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, path });
}
