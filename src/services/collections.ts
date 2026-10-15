import { supabase } from "./supabase";
import { pathFromUrl, removeFiles } from "./images";
import type { Collection, CollectionPayload, Profile } from "../types";

export async function fetchCollections(): Promise<Collection[]> {
  const { data, error } = await supabase
    .from("collections")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Collection[];
}

export async function createCollection(userId: string, payload: CollectionPayload) {
  const { data, error } = await supabase
    .from("collections")
    .insert({ ...payload, user_id: userId })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function updateCollection(id: string, payload: Partial<CollectionPayload>) {
  const { error } = await supabase.from("collections").update(payload).eq("id", id);
  if (error) throw error;
}

export async function deleteCollection(collection: Collection) {
  // Coleta os arquivos antes: o delete em cascata remove as linhas de item_images
  const { data } = await supabase
    .from("item_images")
    .select("storage_path, items!inner(collection_id)")
    .eq("items.collection_id", collection.id);
  const paths = ((data ?? []) as { storage_path: string | null }[])
    .map((r) => r.storage_path)
    .filter((p): p is string => !!p);
  const cover = pathFromUrl(collection.cover_url);
  if (cover) paths.push(cover);

  const { error } = await supabase.from("collections").delete().eq("id", collection.id);
  if (error) throw error;
  await removeFiles(paths);
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function updateProfile(userId: string, payload: Partial<Profile>) {
  const { error } = await supabase.from("profiles").update(payload).eq("id", userId);
  if (error) throw error;
}
