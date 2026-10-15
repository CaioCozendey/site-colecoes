import { supabase } from "./supabase";
import type { ImageEntry, ItemImage } from "../types";

export const BUCKET = "item-images";
export const MAX_IMAGES = 5;

/** Redimensiona (lado maior ≤ 1600px) e converte para JPEG para economizar storage. */
export async function compressImage(file: File, maxSize = 1600, quality = 0.85) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível processar a imagem");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Falha ao processar a imagem"))),
      "image/jpeg",
      quality,
    ),
  );
}

export async function uploadImage(userId: string, folder: string, file: File) {
  let blob: Blob;
  try {
    blob = await compressImage(file);
  } catch {
    throw new Error(`Formato de imagem não suportado: ${file.name}`);
  }
  const path = `${userId}/${folder}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: "image/jpeg" });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export async function removeFiles(paths: string[]) {
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
}

/** Extrai o caminho do storage a partir da URL pública. */
export const pathFromUrl = (url: string | null) => {
  if (!url) return null;
  const marker = `/${BUCKET}/`;
  const idx = url.indexOf(marker);
  return idx >= 0 ? url.slice(idx + marker.length) : null;
};

/**
 * Sincroniza as fotos de um item: remove as excluídas, envia as novas
 * e grava a ordem (a primeira da lista é a foto principal).
 */
export async function syncImages(
  userId: string,
  itemId: string,
  entries: ImageEntry[],
  removed: ItemImage[],
) {
  if (removed.length) {
    const { error } = await supabase
      .from("item_images")
      .delete()
      .in("id", removed.map((r) => r.id));
    if (error) throw error;
    await removeFiles(
      removed.map((r) => r.storage_path).filter((p): p is string => !!p),
    );
  }

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (e.file) {
      const up = await uploadImage(userId, itemId, e.file);
      const { error } = await supabase.from("item_images").insert({
        item_id: itemId,
        user_id: userId,
        image_url: up.url,
        storage_path: up.path,
        sort_order: i,
        is_primary: i === 0,
      });
      if (error) throw error;
    } else if (
      e.image &&
      (e.image.sort_order !== i || e.image.is_primary !== (i === 0))
    ) {
      const { error } = await supabase
        .from("item_images")
        .update({ sort_order: i, is_primary: i === 0 })
        .eq("id", e.image.id);
      if (error) throw error;
    }
  }
}
