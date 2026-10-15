import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Item } from "../../types";
import { useAuth } from "../../contexts/AuthContext";
import { updateItem } from "../../services/items";
import { errorMessage, todayKey } from "../../lib/utils";
import { btnGhost, btnGreen, inputCls, labelCls } from "../../lib/ui";
import Modal from "../ui/Modal";

/** Marca um item da wishlist como adquirido (status wishlist → owned). */
export default function AcquireModal({ item, onClose }: { item: Item; onClose: () => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [price, setPrice] = useState(String(item.desired_price ?? ""));
  const [date, setDate] = useState(todayKey());
  const [source, setSource] = useState(item.purchase_source ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (price !== "" && (isNaN(Number(price)) || Number(price) < 0)) {
      setError("Preço inválido");
      return;
    }
    setSaving(true);
    try {
      await updateItem(user!.id, item.id, {
        status: "owned",
        purchase_price: price === "" ? null : Number(price),
        purchase_date: date || null,
        purchase_source: source.trim() || null,
        priority: null,
      });
      await qc.invalidateQueries({ queryKey: ["items"] });
      onClose();
    } catch (e) {
      setError(errorMessage(e));
      setSaving(false);
    }
  };

  return (
    <Modal title="Marcar como adquirido" onClose={onClose}>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        <strong>{item.name}</strong> sai da wishlist e entra na sua coleção.
      </p>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      <div className="space-y-4">
        <div>
          <label className={labelCls}>Preço pago</label>
          <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Data da compra</label>
          <input type="date" max={todayKey()} value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Onde comprou</label>
          <input value={source} onChange={(e) => setSource(e.target.value)} className={inputCls} />
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={save} disabled={saving} className={`${btnGreen} flex-1`}>
          {saving ? "Salvando..." : "Confirmar"}
        </button>
        <button onClick={onClose} className={`${btnGhost} flex-1`}>Cancelar</button>
      </div>
    </Modal>
  );
}
