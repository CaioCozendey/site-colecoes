import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { useProfile } from "../hooks/useData";
import { updateProfile } from "../services/collections";
import { pathFromUrl, removeFiles, uploadImage } from "../services/images";
import { errorMessage } from "../lib/utils";
import { btnDanger, btnPrimary, cardCls, errCls, inputCls, labelCls } from "../lib/ui";

const schema = z.object({
  name: z.string().trim().min(2, "Informe seu nome"),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .refine((v) => v === "" || /^[a-z0-9_]{3,30}$/.test(v), "3 a 30 caracteres: letras, números e _"),
  currency: z.enum(["BRL", "USD", "EUR"]),
  is_public: z.boolean(),
});
type Values = z.infer<typeof schema>;

export default function Settings() {
  const { user, signOut } = useAuth();
  const qc = useQueryClient();
  const { data: profile, isLoading } = useProfile();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", username: "", currency: "BRL", is_public: false },
  });

  useEffect(() => {
    if (profile) {
      reset({ name: profile.name ?? "", username: profile.username ?? "", currency: profile.currency, is_public: profile.is_public });
      setPreview(profile.avatar_url);
    }
  }, [profile, reset]);

  if (isLoading) return <p className="text-center text-gray-600 dark:text-gray-400">Carregando...</p>;

  const onSubmit = handleSubmit(async (v) => {
    setMsg(null);
    try {
      let avatar_url = profile?.avatar_url ?? null;
      if (avatarFile) {
        const up = await uploadImage(user!.id, "avatar", avatarFile);
        const old = pathFromUrl(avatar_url);
        avatar_url = up.url;
        if (old) await removeFiles([old]);
      }
      await updateProfile(user!.id, {
        name: v.name.trim(),
        username: v.username || null,
        currency: v.currency,
        is_public: v.is_public,
        avatar_url,
      });
      await qc.invalidateQueries({ queryKey: ["profile"] });
      setAvatarFile(null);
      setMsg({ ok: true, text: "Configurações salvas!" });
    } catch (e) {
      const text = errorMessage(e);
      setMsg({ ok: false, text: /duplicate|unique/i.test(text) ? "Este username já está em uso" : text });
    }
  });

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">⚙️ Configurações</h2>

      <form onSubmit={onSubmit} className={`${cardCls} p-6 space-y-6`}>
        {msg && (
          <div className={`rounded-md p-4 text-sm ${msg.ok ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200" : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200"}`}>
            {msg.text}
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex items-center justify-center text-3xl">
            {preview ? <img src={preview} alt="" className="w-full h-full object-cover" /> : "👤"}
          </div>
          <label className="text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
            Alterar foto
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setAvatarFile(f); setPreview(URL.createObjectURL(f)); }
              }}
            />
          </label>
        </div>

        <div>
          <label className={labelCls}>Nome</label>
          <input className={inputCls} {...register("name")} />
          {errors.name && <p className={errCls}>{errors.name.message}</p>}
        </div>
        <div>
          <label className={labelCls}>Username</label>
          <input className={inputCls} placeholder="caio_cozendey" {...register("username")} />
          {errors.username && <p className={errCls}>{errors.username.message}</p>}
        </div>
        <div>
          <label className={labelCls}>E-mail</label>
          <input className={`${inputCls} opacity-60`} value={user?.email ?? ""} disabled readOnly />
        </div>
        <div>
          <label className={labelCls}>Moeda padrão</label>
          <select className={inputCls} {...register("currency")}>
            <option value="BRL">BRL — Real</option>
            <option value="USD">USD — Dólar</option>
            <option value="EUR">EUR — Euro</option>
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Define apenas como os valores são exibidos; não faz conversão cambial.
          </p>
        </div>
        <label className="flex items-center gap-3 cursor-pointer text-gray-700 dark:text-gray-300">
          <input type="checkbox" className="w-5 h-5" {...register("is_public")} />
          Perfil público
        </label>

        <button type="submit" disabled={isSubmitting} className={`${btnPrimary} w-full py-3`}>
          {isSubmitting ? "Salvando..." : "Salvar"}
        </button>
      </form>

      <button onClick={signOut} className={`${btnDanger} w-full mt-6 md:hidden`}>Sair</button>
    </div>
  );
}
