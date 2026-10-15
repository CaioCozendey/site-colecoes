import { supabase } from "./supabase";
import { removeFiles } from "./images";
import { normalizeTag } from "../lib/utils";
import type { Item, ItemPayload, Tag } from "../types";

type RawItem = Omit<Item, "tags"> & { item_tags?: { tags: Tag | null }[] };

function normalize(raw: RawItem): Item {
  const { item_tags, ...rest } = raw;
  return {
    ...rest,
    item_images: [...(rest.item_images ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order,
    ),
    tags: (item_tags ?? [])
      .map((t) => t.tags)
      .filter((t): t is Tag => !!t),
  };
}

export async function fetchItems(): Promise<Item[]> {
  const { data, error } = await supabase
    .from("items")
    .select("*, item_images(*), item_tags(tags(*))")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as RawItem[]).map(normalize);
}

export async function syncTags(userId: string, itemId: string, names: string[]) {
  const clean = [...new Set(names.map(normalizeTag).filter(Boolean))];

  const { error: delError } = await supabase
    .from("item_tags")
    .delete()
    .eq("item_id", itemId);
  if (delError) throw delError;
  if (!clean.length) return;

  const { data, error } = await supabase
    .from("tags")
    .upsert(
      clean.map((name) => ({ user_id: userId, name })),
      { onConflict: "user_id,name" },
    )
    .select();
  if (error) throw error;

  const { error: linkError } = await supabase
    .from("item_tags")
    .insert((data as Tag[]).map((t) => ({ item_id: itemId, tag_id: t.id })));
  if (linkError) throw linkError;
}

export async function createItem(
  userId: string,
  payload: ItemPayload,
  tags: string[],
) {
  const { data, error } = await supabase
    .from("items")
    .insert({ ...payload, user_id: userId })
    .select("id")
    .single();
  if (error) throw error;
  await syncTags(userId, data.id as string, tags);
  return data.id as string;
}

export async function updateItem(
  userId: string,
  id: string,
  payload: Partial<ItemPayload>,
  tags?: string[],
) {
  const { error } = await supabase.from("items").update(payload).eq("id", id);
  if (error) throw error;
  if (tags) await syncTags(userId, id, tags);
}

export async function deleteItem(item: Item) {
  const { error } = await supabase.from("items").delete().eq("id", item.id);
  if (error) throw error;
  await removeFiles(
    item.item_images
      .map((i) => i.storage_path)
      .filter((p): p is string => !!p),
  );
}
