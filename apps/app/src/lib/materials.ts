import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export const MATERIALS_BUCKET = "aprova+";

function isExternalUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

export function getMaterialStoragePath(fileUrl: string | null) {
  if (!fileUrl || isExternalUrl(fileUrl)) {
    return null;
  }

  if (fileUrl.startsWith(`${MATERIALS_BUCKET}/`)) {
    return fileUrl.slice(MATERIALS_BUCKET.length + 1);
  }

  return fileUrl;
}

export async function getMaterialDownloadUrl(fileUrl: string | null) {
  if (!fileUrl) {
    return null;
  }

  if (isExternalUrl(fileUrl)) {
    return fileUrl;
  }

  const path = getMaterialStoragePath(fileUrl);

  if (!path) {
    return null;
  }

  const { data, error } = await createAdminClient()
    .storage.from(MATERIALS_BUCKET)
    .createSignedUrl(path, 60 * 60);

  if (error) {
    return null;
  }

  return data.signedUrl;
}

export function sanitizeStorageFileName(fileName: string) {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}
