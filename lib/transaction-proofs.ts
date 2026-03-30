import type { SupabaseClient } from "@supabase/supabase-js";

export const TRANSACTION_PROOF_BUCKET = "transaction-proofs";

function sanitizeFileName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "proof";
}

function randomPart() {
  return Math.random().toString(36).slice(2, 8);
}

export function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function uploadTransactionProof(
  supabase: SupabaseClient,
  userId: string,
  file: File
) {
  const cleanName = sanitizeFileName(file.name);
  const path = `${userId}/${new Date().getFullYear()}/${Date.now()}-${randomPart()}-${cleanName}`;
  const { error } = await supabase.storage
    .from(TRANSACTION_PROOF_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined
    });

  if (error) throw error;

  return {
    path,
    fileName: file.name,
    mimeType: file.type || null
  };
}

export async function removeTransactionProof(
  supabase: SupabaseClient,
  proofPath?: string | null
) {
  if (!proofPath) return;
  const { error } = await supabase.storage
    .from(TRANSACTION_PROOF_BUCKET)
    .remove([proofPath]);
  if (error) throw error;
}

export async function createTransactionProofSignedUrl(
  supabase: SupabaseClient,
  proofPath: string,
  expiresIn = 60 * 10
) {
  const { data, error } = await supabase.storage
    .from(TRANSACTION_PROOF_BUCKET)
    .createSignedUrl(proofPath, expiresIn);

  if (error) throw error;
  return data.signedUrl;
}
