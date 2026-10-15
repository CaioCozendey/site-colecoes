export type Status = "owned" | "wishlist";
export type Priority = "low" | "medium" | "high";
export type Currency = "BRL" | "USD" | "EUR";
export type Visibility = "private" | "public";

export interface Profile {
  id: string;
  username: string | null;
  name: string | null;
  avatar_url: string | null;
  currency: Currency;
  is_public: boolean;
  created_at: string;
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: string;
  cover_url: string | null;
  visibility: Visibility;
  goal_count: number | null;
  created_at: string;
  updated_at: string;
}

export interface ItemImage {
  id: string;
  item_id: string;
  user_id: string;
  image_url: string;
  storage_path: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
}

export interface Item {
  id: string;
  collection_id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: Status;
  year: string | null;
  creator: string | null;
  reference_code: string | null;
  condition: string | null;
  quantity: number;
  purchase_price: number | null;
  estimated_value: number | null;
  desired_price: number | null;
  purchase_date: string | null;
  purchase_source: string | null;
  priority: Priority | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  item_images: ItemImage[];
  tags: Tag[];
}

export type ItemPayload = Omit<
  Item,
  "id" | "user_id" | "created_at" | "updated_at" | "item_images" | "tags"
>;

export type CollectionPayload = Omit<
  Collection,
  "id" | "user_id" | "created_at" | "updated_at"
>;

/** Uma foto na tela de edição: já salva (image) ou nova (file). */
export interface ImageEntry {
  key: string;
  image?: ItemImage;
  file?: File;
  preview: string;
}
