import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { useCollections, useItems } from "../hooks/useData";
import { createItem, updateItem } from "../services/items";
import { syncImages } from "../services/images";
import { CONDITION_SUGGESTIONS, errorMessage, PRIORITY_LABEL, todayKey } from "../lib/utils";
import { btnPrimary, btnSecondary, errCls, inputCls, labelCls } from "../lib/ui";
import type { ImageEntry, ItemImage, ItemPayload } from "../types";
import TagInput from "../components/items/TagInput";
import ImageManager from "../components/items/ImageManager";

const money = z.string().refine((v) => v === "" || (!isNaN(Number(v)) && Number(v) >= 0), "Valor inválido");

const schema = z.object({
  collection_id: z.string().min(1, "Selecione a coleção"),
  name: z.string().trim().min(1, "Informe o nome").max(200),
  description: z.string().optional(),
  status: z.enum(["owned", "wishlist"]),
  year: z.string().optional(),
  creator: z.string().optional(),
  reference_code: z.string().optional(),
  condition: z.string().optional(),
  quantity: z.string().refine((v) => /^\d+$/.test(v) && Number(v) >= 1, "Mínimo 1"),
  purchase_price: money,
  estimated_value: money,
  desired_price: money,
  purchase_date: z.string().optional(),
  purchase_source: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  notes: z.string().optional(),
});
type Values = z.infer<typeof schema>;

const num = (v: string) => (v === "" ? null : Number(v));
const txt = (v?: string) => v?.trim() || null;

export default function ItemForm() {
  const { id, collectionId } = useParams<{ id: string; collectionId: string }>();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: collections = [] } = useCollections();
  const { data: items = [], isLoading } = useItems();

  const editing = items.find((i) => i.id === id);
  const createdId = useRef<string | null>(null);

  const [tags, setTags] = useState<string[]>([]);
  const [entries, setEntries] = useState<ImageEntry[]>([]);
  const [removed, setRemoved] = useState<ItemImage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const allTags = useMemo(() => [...new Set(items.flatMap((i) => i.tags.map((t) => t.name)))].sort(), [items]);

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      collection_id: collectionId ?? "",
      name: "",
      description: "",
      status: search.get("status") === "wishlist" ? "wishlist" : "owned",
      year: "",
      creator: "",
      reference_code: "",
      condition: "",
      quantity: "1",
      purchase_price: "",
      estimated_value: "",
      desired_price: "",
      purchase_date: todayKey(),
      purchase_source: "",
      priority: "medium",
      notes: "",
    },
  });

  useEffect(() => {
    if (!editing) return;
    reset({
      collection_id: editing.collection_id,
      name: editing.name,
      description: editing.description ?? "",
      status: editing.status,
      year: editing.year ?? "",
      creator: editing.creator ?? "",
      reference_code: editing.reference_code ?? "",
      condition: editing.condition ?? "",
      quantity: String(editing.quantity),
      purchase_price: String(editing.purchase_price ?? ""),
      estimated_value: String(editing.estimated_value ?? ""),
      desired_price: String(editing.desired_price ?? ""),
      purchase_date: editing.purchase_date ?? "",
      purchase_source: editing.purchase_source ?? "",
      priority: editing.priority ?? "medium",
      notes: editing.notes ?? "",
    });
    setTags(editing.tags.map((t) => t.name));
    setEntries(editing.item_images.map((img) => ({ key: img.id, image: img, preview: img.image_url })));
  }, [editing, reset]);

  const status = watch("status");

  if (id && isLoading) return <p className="text-center text-gray-600 dark:text-gray-400">Carregando...</p>;
  if (id && !editing) return <p className="text-center text-gray-600 dark:text-gray-400">Item não encontrado.</p>;

  const onSubmit = handleSubmit(async (v) => {
    setError(null);
    const owned = v.status === "owned";
    const payload: ItemPayload = {
      collection_id: v.collection_id,
      name: v.name.trim(),
      description: txt(v.description),
      status: v.status,
      year: txt(v.year),
      creator: txt(v.creator),
      reference_code: txt(v.reference_code),
      condition: txt(v.condition),
      quantity: Number(v.quantity),
      purchase_price: owned ? num(v.purchase_price) : null,
      estimated_value: owned ? num(v.estimated_value) : null,
      desired_price: owned ? null : num(v.desired_price),
      purchase_date: owned ? v.purchase_date || null : null,
      purchase_source: owned ? txt(v.purchase_source) : null,
      priority: owned ? null : v.priority,
      notes: txt(v.notes),
    };

    try {
      // Se uma tentativa anterior criou o item mas falhou nas fotos, atualiza em vez de duplicar
      let itemId = editing?.id ?? createdId.current;
      if (itemId) await updateItem(user!.id, itemId, payload, tags);
      else {
        itemId = await createItem(user!.id, payload, tags);
        createdId.current = itemId;
      }
      await syncImages(user!.id, itemId, entries, removed);
      await qc.invalidateQueries({ queryKey: ["items"] });
      navigate(`/items/${itemId}`);
    } catch (e) {
      setError(errorMessage(e));
    }
  });

  const section = "text-lg font-semibold text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2";

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">
        {editing ? "Editar Item" : status === "wishlist" ? "Novo Item da Wishlist" : "Novo Item"}
      </h2>

      <form onSubmit={onSubmit} className="space-y-6">
        {error && <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-800 dark:text-red-200">{error}</div>}

        <h3 className={section}>Dados principais</h3>
        <div>
          <label className={labelCls}>Nome *</label>
          <input className={inputCls} placeholder="Ex: 2.000 Réis D. Pedro II" {...register("name")} />
          {errors.name && <p className={errCls}>{errors.name.message}</p>}
        </div>
        <div>
          <label className={labelCls}>Coleção *</label>
          <select className={inputCls} {...register("collection_id")}>
            <option value="">Selecione...</option>
            {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {errors.collection_id && <p className={errCls}>{errors.collection_id.message}</p>}
        </div>
        <div>
          <label className={labelCls}>Descrição</label>
          <textarea rows={2} className={inputCls} {...register("description")} />
        </div>
        <div>
          <label className={labelCls}>Status</label>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
              <input type="radio" value="owned" {...register("status")} /> ✅ Tenho
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
              <input type="radio" value="wishlist" {...register("status")} /> ❤️ Wishlist
            </label>
          </div>
        </div>

        <h3 className={section}>Informações</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className={labelCls}>Ano</label>
            <input className={inputCls} placeholder="1889" {...register("year")} />
          </div>
          <div>
            <label className={labelCls}>Fabricante / Autor / Emissor</label>
            <input className={inputCls} placeholder="Brasil" {...register("creator")} />
          </div>
          <div>
            <label className={labelCls}>Número / Código / Referência</label>
            <input className={inputCls} placeholder="KM# 485" {...register("reference_code")} />
          </div>
          <div>
            <label className={labelCls}>Estado de conservação</label>
            <input list="conditions" className={inputCls} placeholder="MBC, Excelente..." {...register("condition")} />
            <datalist id="conditions">{CONDITION_SUGGESTIONS.map((c) => <option key={c} value={c} />)}</datalist>
          </div>
          <div>
            <label className={labelCls}>Quantidade</label>
            <input type="number" min="1" className={inputCls} {...register("quantity")} />
            {errors.quantity && <p className={errCls}>{errors.quantity.message}</p>}
          </div>
        </div>

        <h3 className={section}>Financeiro</h3>
        {status === "owned" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className={labelCls}>Preço pago</label>
              <input type="number" min="0" step="0.01" className={inputCls} {...register("purchase_price")} />
              {errors.purchase_price && <p className={errCls}>{errors.purchase_price.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Valor estimado</label>
              <input type="number" min="0" step="0.01" className={inputCls} {...register("estimated_value")} />
              {errors.estimated_value && <p className={errCls}>{errors.estimated_value.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Data da compra</label>
              <input type="date" max={todayKey()} className={inputCls} {...register("purchase_date")} />
            </div>
            <div>
              <label className={labelCls}>Onde comprou</label>
              <input className={inputCls} placeholder="Marcon Numismática" {...register("purchase_source")} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className={labelCls}>Preço desejado</label>
              <input type="number" min="0" step="0.01" className={inputCls} {...register("desired_price")} />
              {errors.desired_price && <p className={errCls}>{errors.desired_price.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Prioridade</label>
              <select className={inputCls} {...register("priority")}>
                {(Object.keys(PRIORITY_LABEL) as (keyof typeof PRIORITY_LABEL)[]).map((p) => (
                  <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <h3 className={section}>Organização</h3>
        <div>
          <label className={labelCls}>Tags</label>
          <TagInput value={tags} onChange={setTags} suggestions={allTags} />
        </div>
        <div>
          <label className={labelCls}>Observações</label>
          <textarea rows={3} className={inputCls} {...register("notes")} />
        </div>

        <h3 className={section}>Fotos</h3>
        <ImageManager entries={entries} setEntries={setEntries} setRemoved={setRemoved} />

        <div className="flex gap-4 pt-4">
          <button type="submit" disabled={isSubmitting} className={`${btnPrimary} flex-1 py-3`}>
            {isSubmitting ? "Salvando..." : editing ? "Salvar alterações" : "Adicionar item"}
          </button>
          <button type="button" onClick={() => navigate(-1)} className={`${btnSecondary} flex-1 py-3`}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
