import type { Currency, Item, ItemImage, Priority } from "../types";

export const CATEGORIES = [
  "Moedas",
  "Cédulas",
  "Livros",
  "Mangás",
  "HQs",
  "Cartas",
  "Selos",
  "Miniaturas",
  "Jogos",
  "Relógios",
  "Antiguidades",
  "Outros",
];

export const CATEGORY_ICONS: Record<string, string> = {
  Moedas: "🪙",
  Cédulas: "💵",
  Livros: "📚",
  Mangás: "📖",
  HQs: "🦸",
  Cartas: "🎴",
  Selos: "✉️",
  Miniaturas: "🚗",
  Jogos: "🎮",
  Relógios: "⌚",
  Antiguidades: "🏺",
  Outros: "📦",
};

export const categoryIcon = (c: string) => CATEGORY_ICONS[c] ?? "📦";

export const CONDITION_SUGGESTIONS = [
  "Novo / Lacrado",
  "Excelente",
  "Muito bom",
  "Bom",
  "Regular",
  "Ruim",
  "FC",
  "SOB",
  "MBC",
  "BC",
  "REG",
];

export const PRIORITY_LABEL: Record<Priority, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};
export const PRIORITY_ORDER: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};
export const PRIORITY_STYLE: Record<Priority, string> = {
  high: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  low: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
};

export function formatMoney(
  value: number | null | undefined,
  currency: Currency = "BRL",
) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(
    value ?? 0,
  );
}

export function formatPercent(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return d.toLocaleDateString("pt-BR");
}

export const todayKey = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export function primaryImage(item: Item): ItemImage | undefined {
  return item.item_images.find((i) => i.is_primary) ?? item.item_images[0];
}

/** Valor de referência do item: estimado/pago (tenho) ou desejado (wishlist). */
export function itemValue(item: Item): number {
  if (item.status === "wishlist") return item.desired_price ?? 0;
  return item.estimated_value ?? item.purchase_price ?? 0;
}

export interface Summary {
  count: number;
  invested: number;
  estimated: number;
  difference: number;
  appreciation: number | null; // %
  wishlist: number;
}

/** Totais de uma lista de itens. Investido/estimado consideram só os itens "owned". */
export function summarize(items: Item[]): Summary {
  const owned = items.filter((i) => i.status === "owned");
  const invested = owned.reduce((s, i) => s + (i.purchase_price ?? 0), 0);
  const estimated = owned.reduce(
    (s, i) => s + (i.estimated_value ?? i.purchase_price ?? 0),
    0,
  );
  const difference = estimated - invested;
  return {
    count: owned.length,
    invested,
    estimated,
    difference,
    appreciation: invested > 0 ? (difference / invested) * 100 : null,
    wishlist: items.length - owned.length,
  };
}

export const normalizeTag = (t: string) =>
  t.trim().replace(/^#/, "").replace(/\s+/g, " ").toLowerCase();

export const errorMessage = (e: unknown) =>
  e instanceof Error
    ? e.message
    : typeof e === "object" && e && "message" in e
      ? String((e as { message: unknown }).message)
      : "Ocorreu um erro inesperado";
