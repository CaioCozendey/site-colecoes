import { useNavigate } from "react-router-dom";
import type { Collection } from "../../types";
import { btnPrimary } from "../../lib/ui";

/** Botão "+ Adicionar item": vai direto se há 1 coleção, ou pergunta qual. */
export default function AddItemSelect({
  collections,
  status,
  label = "+ Adicionar item",
}: {
  collections: Collection[];
  status?: "wishlist";
  label?: string;
}) {
  const navigate = useNavigate();
  const qs = status ? `?status=${status}` : "";

  if (collections.length === 0) {
    return (
      <button className={btnPrimary} onClick={() => navigate("/collections/new")}>
        + Criar primeira coleção
      </button>
    );
  }
  if (collections.length === 1) {
    return (
      <button
        className={btnPrimary}
        onClick={() => navigate(`/collections/${collections[0].id}/items/new${qs}`)}
      >
        {label}
      </button>
    );
  }
  return (
    <select
      value=""
      onChange={(e) =>
        e.target.value && navigate(`/collections/${e.target.value}/items/new${qs}`)
      }
      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg cursor-pointer"
      aria-label={label}
    >
      <option value="">{label}</option>
      {collections.map((c) => (
        <option key={c.id} value={c.id} className="text-gray-800">
          {c.name}
        </option>
      ))}
    </select>
  );
}
