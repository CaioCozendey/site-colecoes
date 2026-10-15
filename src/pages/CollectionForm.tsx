import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { useCollections } from "../hooks/useData";
import { createCollection, updateCollection } from "../services/collections";
import { pathFromUrl, removeFiles, uploadImage } from "../services/images";
import { CATEGORIES, errorMessage } from "../lib/utils";
import { btnPrimary, btnSecondary, errCls, inputCls, labelCls } from "../lib/ui";

const schema = z.object({
  name: z.string().trim().min(1, "Informe o nome").max(120),
  description: z.string().optional(),
  category: z.string().min(1),
  goal_count: z.string().refine((v) => v === "" || (/^\d+$/.test(v) && Number(v) > 0), "Informe um número maior que zero"),
  visibility: z.enum(["private", "public"]),
});
type Values = z.infer<typeof schema>;

export default function CollectionForm() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: collections = [], isLoading } = useCollections();
  const editing = collections.find((c) => c.id === id);

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "", category: "Moedas", goal_count: "", visibility: "private" },
  });

  useEffect(() => {
    if (editing) {
      reset({
        name: editing.name,
        description: editing.description ?? "",
        category: editing.category,
        goal_count: editing.goal_count ? String(editing.goal_count) : "",
        visibility: editing.visibility,
      });
      setPreview(editing.cover_url);
    }
  }, [editing, reset]);

  if (id && isLoading) return <p className="text-center text-gray-600 dark:text-gray-400">Carregando...</p>;
  if (id && !editing) return <p className="text-center text-gray-600 dark:text-gray-400">Coleção não encontrada.</p>;

  const onSubmit = handleSubmit(async (v) => {
    setError(null);
    try {
      let cover_url = editing?.cover_url ?? null;
      if (coverFile && user) {
        const up = await uploadImage(user.id, "covers", coverFile);
        const old = pathFromUrl(cover_url);
        cover_url = up.url;
        if (old) await removeFiles([old]);
      }
      const payload = {
        name: v.name.trim(),
        description: v.description?.trim() || null,
        category: v.category,
        cover_url,
        visibility: v.visibility,
        goal_count: v.goal_count ? Number(v.goal_count) : null,
      };
      let target = id;
      if (editing) await updateCollection(editing.id, payload);
      else target = await createCollection(user!.id, payload);
      await qc.invalidateQueries({ queryKey: ["collections"] });
      navigate(`/collections/${target}`);
    } catch (e) {
      setError(errorMessage(e));
    }
  });

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">
        {editing ? "Editar Coleção" : "Nova Coleção"}
      </h2>
      <form onSubmit={onSubmit} className="space-y-6">
        {error && <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-800 dark:text-red-200">{error}</div>}

        <div>
          <label className={labelCls}>Nome *</label>
          <input className={inputCls} placeholder="Ex: Moedas do Brasil Império" {...register("name")} />
          {errors.name && <p className={errCls}>{errors.name.message}</p>}
        </div>

        <div>
          <label className={labelCls}>Descrição</label>
          <textarea rows={3} className={inputCls} placeholder="Ex: Moedas brasileiras entre 1822 e 1889." {...register("description")} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className={labelCls}>Categoria</label>
            <select className={inputCls} {...register("category")}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Visibilidade</label>
            <select className={inputCls} {...register("visibility")}>
              <option value="private">Privada</option>
              <option value="public">Pública</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>Objetivo da coleção (nº de itens)</label>
          <input type="number" min="1" className={inputCls} placeholder="Ex: 68" {...register("goal_count")} />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Opcional. Mostra uma barra de progresso: quantos itens você tem até a meta.
          </p>
          {errors.goal_count && <p className={errCls}>{errors.goal_count.message}</p>}
        </div>

        <div>
          <label className={labelCls}>Imagem de capa</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="text-sm text-gray-700 dark:text-gray-300"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setCoverFile(f);
                setPreview(URL.createObjectURL(f));
              }
            }}
          />
          {preview && <img src={preview} alt="Capa" className="mt-3 h-36 w-full max-w-sm object-cover rounded-lg" />}
        </div>

        <div className="flex gap-4 pt-2">
          <button type="submit" disabled={isSubmitting} className={`${btnPrimary} flex-1 py-3`}>
            {isSubmitting ? "Salvando..." : editing ? "Salvar alterações" : "Criar coleção"}
          </button>
          <button type="button" onClick={() => navigate(-1)} className={`${btnSecondary} flex-1 py-3`}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
