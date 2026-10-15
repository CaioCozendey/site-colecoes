import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCollections, useItems, useMoney } from "../hooks/useData";
import { PRIORITY_LABEL, PRIORITY_ORDER, PRIORITY_STYLE, primaryImage } from "../lib/utils";
import { btnGreen, cardCls, inputCls } from "../lib/ui";
import type { Item, Priority } from "../types";
import AddItemSelect from "../components/collections/AddItemSelect";
import AcquireModal from "../components/items/AcquireModal";

export default function Wishlist() {
  const money = useMoney();
  const { data: items = [], isLoading } = useItems();
  const { data: collections = [] } = useCollections();
  const [collectionId, setCollectionId] = useState("");
  const [priority, setPriority] = useState<"" | Priority>("");
  const [acquiring, setAcquiring] = useState<Item | null>(null);

  const list = useMemo(
    () =>
      items
        .filter((i) => i.status === "wishlist")
        .filter((i) => !collectionId || i.collection_id === collectionId)
        .filter((i) => !priority || i.priority === priority)
        .sort(
          (a, b) =>
            PRIORITY_ORDER[a.priority ?? "low"] - PRIORITY_ORDER[b.priority ?? "low"] ||
            a.name.localeCompare(b.name, "pt-BR"),
        ),
    [items, collectionId, priority],
  );

  const total = list.reduce((s, i) => s + (i.desired_price ?? 0), 0);
  const nameOf = (id: string) => collections.find((c) => c.id === id)?.name ?? "—";

  if (isLoading) return <p className="text-center text-gray-600 dark:text-gray-400">Carregando...</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">❤️ Wishlist ({list.length})</h2>
          <p className="text-gray-600 dark:text-gray-400">Total desejado: {money(total)}</p>
        </div>
        <AddItemSelect collections={collections} status="wishlist" label="+ Novo item desejado" />
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={collectionId} onChange={(e) => setCollectionId(e.target.value)} className={`${inputCls} !w-auto`}>
          <option value="">Todas as coleções</option>
          {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value as "" | Priority)} className={`${inputCls} !w-auto`}>
          <option value="">Todas as prioridades</option>
          {(Object.keys(PRIORITY_LABEL) as Priority[]).map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
        </select>
      </div>

      {list.length === 0 ? (
        <div className={`${cardCls} p-12 text-center text-gray-600 dark:text-gray-400`}>
          Sua wishlist está vazia. Adicione os itens que você quer conseguir!
        </div>
      ) : (
        <div className={`${cardCls} overflow-x-auto`}>
          <table className="w-full text-left">
            <thead>
              <tr className="text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="p-3">Item</th>
                <th className="p-3">Coleção</th>
                <th className="p-3">Preço desejado</th>
                <th className="p-3">Prioridade</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {list.map((i) => {
                const img = primaryImage(i);
                return (
                  <tr key={i.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="p-3">
                      <Link to={`/items/${i.id}`} className="flex items-center gap-3 min-w-[200px]">
                        <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden flex items-center justify-center shrink-0">
                          {img ? <img src={img.image_url} alt="" className="w-full h-full object-cover" /> : "🏺"}
                        </div>
                        <span className="font-semibold text-gray-800 dark:text-white">{i.name}</span>
                      </Link>
                    </td>
                    <td className="p-3 text-gray-700 dark:text-gray-300">{nameOf(i.collection_id)}</td>
                    <td className="p-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {i.desired_price != null ? money(i.desired_price) : "—"}
                    </td>
                    <td className="p-3">
                      {i.priority && (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${PRIORITY_STYLE[i.priority]}`}>
                          {PRIORITY_LABEL[i.priority]}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button onClick={() => setAcquiring(i)} className={`${btnGreen} !py-1.5 text-sm whitespace-nowrap`}>
                        ✅ Adquirido
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {acquiring && <AcquireModal item={acquiring} onClose={() => setAcquiring(null)} />}
    </div>
  );
}
