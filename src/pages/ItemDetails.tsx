import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { useCollections, useItems, useMoney } from "../hooks/useData";
import { deleteItem, updateItem } from "../services/items";
import { errorMessage, formatDate, formatPercent, PRIORITY_LABEL, PRIORITY_STYLE } from "../lib/utils";
import { btnDanger, btnGhost, btnGreen, btnPrimary, cardCls } from "../lib/ui";
import AcquireModal from "../components/items/AcquireModal";

export default function ItemDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const money = useMoney();
  const { data: items = [], isLoading } = useItems();
  const { data: collections = [] } = useCollections();
  const [selected, setSelected] = useState(0);
  const [acquiring, setAcquiring] = useState(false);

  const item = items.find((i) => i.id === id);
  const collection = collections.find((c) => c.id === item?.collection_id);

  if (isLoading) return <p className="text-center text-gray-600 dark:text-gray-400">Carregando...</p>;
  if (!item) {
    return (
      <div className="text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">Item não encontrado.</p>
        <Link to="/collections" className="text-blue-600 dark:text-blue-400 hover:underline">← Voltar</Link>
      </div>
    );
  }

  const images = item.item_images;
  const current = images[Math.min(selected, images.length - 1)];
  const owned = item.status === "owned";
  const paid = item.purchase_price;
  const est = item.estimated_value;
  const diff = paid != null && est != null ? est - paid : null;
  const pct = diff !== null && paid ? (diff / paid) * 100 : null;

  const handleDelete = async () => {
    if (!window.confirm(`Excluir "${item.name}"?`)) return;
    try {
      await deleteItem(item);
      await qc.invalidateQueries({ queryKey: ["items"] });
      navigate(`/collections/${item.collection_id}`);
    } catch (e) {
      alert(errorMessage(e));
    }
  };

  const moveToWishlist = async () => {
    if (!window.confirm("Mover este item para a wishlist? Os dados de compra serão limpos.")) return;
    try {
      await updateItem(user!.id, item.id, {
        status: "wishlist",
        desired_price: item.purchase_price,
        priority: "medium",
        purchase_price: null,
        estimated_value: null,
        purchase_date: null,
        purchase_source: null,
      });
      await qc.invalidateQueries({ queryKey: ["items"] });
    } catch (e) {
      alert(errorMessage(e));
    }
  };

  const info: [string, string | number | null][] = [
    ["Ano", item.year],
    ["Fabricante / Autor / Emissor", item.creator],
    ["Código / Referência", item.reference_code],
    ["Estado", item.condition],
    ["Quantidade", item.quantity],
  ];

  return (
    <div className="space-y-6">
      <Link to={`/collections/${item.collection_id}`} className="text-blue-600 dark:text-blue-400 hover:underline inline-block">
        ← {collection?.name ?? "Coleção"}
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Galeria */}
        <div className="md:col-span-2 space-y-3">
          <div className={`${cardCls} overflow-hidden aspect-square bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-7xl`}>
            {current ? <img src={current.image_url} alt={item.name} className="w-full h-full object-contain" /> : "🏺"}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setSelected(idx)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 ${idx === selected ? "border-blue-600" : "border-transparent"}`}
                >
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Informações */}
        <div className="md:col-span-3 space-y-6">
          <div className={`${cardCls} p-6`}>
            <div className="flex flex-wrap gap-2 mb-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${owned ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" : "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300"}`}>
                {owned ? "✅ Tenho" : "❤️ Wishlist"}
              </span>
              {!owned && item.priority && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${PRIORITY_STYLE[item.priority]}`}>
                  Prioridade {PRIORITY_LABEL[item.priority].toLowerCase()}
                </span>
              )}
            </div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">{item.name}</h2>
            {item.description && <p className="text-gray-600 dark:text-gray-300 mb-4 whitespace-pre-wrap">{item.description}</p>}

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {info.filter(([, v]) => v !== null && v !== "").map(([k, v]) => (
                <div key={k}>
                  <dt className="text-gray-500 dark:text-gray-400">{k}</dt>
                  <dd className="font-medium text-gray-800 dark:text-white">{v}</dd>
                </div>
              ))}
            </dl>

            {item.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {item.tags.map((t) => (
                  <span key={t.id} className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
                    #{t.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Financeiro */}
          <div className={`${cardCls} p-6`}>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Financeiro</h3>
            {owned ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Preço pago</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">{paid != null ? money(paid) : "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Valor estimado</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">{est != null ? money(est) : "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Diferença</p>
                  {diff === null ? (
                    <p className="text-xl font-bold text-gray-800 dark:text-white">—</p>
                  ) : (
                    <p className={`text-xl font-bold ${diff >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {diff >= 0 ? "+" : ""}{money(diff)}
                      {pct !== null && <span className="block text-sm">{formatPercent(pct)}</span>}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-800 dark:text-white">
                Preço desejado: <strong>{item.desired_price != null ? money(item.desired_price) : "—"}</strong>
              </p>
            )}
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <p>Adicionado em: {formatDate(item.created_at)}</p>
              {owned && item.purchase_date && <p>Comprado em: {formatDate(item.purchase_date)}</p>}
              {owned && item.purchase_source && <p>Onde comprou: {item.purchase_source}</p>}
            </div>
          </div>

          {item.notes && (
            <div className={`${cardCls} p-6`}>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Observações</h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{item.notes}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Link to={`/items/${item.id}/edit`} className={btnPrimary}>Editar</Link>
            {owned ? (
              <button onClick={moveToWishlist} className={btnGhost}>Mover para Wishlist</button>
            ) : (
              <button onClick={() => setAcquiring(true)} className={btnGreen}>✅ Marcar como adquirido</button>
            )}
            <button onClick={handleDelete} className={btnDanger}>Excluir</button>
          </div>
        </div>
      </div>

      {acquiring && <AcquireModal item={item} onClose={() => setAcquiring(false)} />}
    </div>
  );
}
