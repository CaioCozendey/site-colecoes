import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useCollections, useItems, useMoney } from "../hooks/useData";
import { deleteCollection } from "../services/collections";
import { categoryIcon, errorMessage, formatPercent, itemValue, summarize } from "../lib/utils";
import { btnDanger, btnGhost, btnPrimary, cardCls, inputCls } from "../lib/ui";
import { ItemGridCard, ItemListRow } from "../components/items/ItemCard";
import Progress from "../components/ui/Progress";

type Tab = "all" | "owned" | "wishlist";
type Sort = "recent" | "oldest" | "name" | "high" | "low";

export default function CollectionDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const money = useMoney();
  const { data: collections = [], isLoading } = useCollections();
  const { data: allItems = [] } = useItems();

  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("");
  const [condition, setCondition] = useState("");
  const [tag, setTag] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState<Sort>("recent");
  const [view, setView] = useState<"grid" | "list">("grid");

  const collection = collections.find((c) => c.id === id);
  const items = useMemo(() => allItems.filter((i) => i.collection_id === id), [allItems, id]);

  const years = useMemo(() => [...new Set(items.map((i) => i.year).filter(Boolean))].sort() as string[], [items]);
  const conditions = useMemo(() => [...new Set(items.map((i) => i.condition).filter(Boolean))].sort() as string[], [items]);
  const tags = useMemo(() => [...new Set(items.flatMap((i) => i.tags.map((t) => t.name)))].sort(), [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const min = minPrice === "" ? null : Number(minPrice);
    const max = maxPrice === "" ? null : Number(maxPrice);
    const list = items.filter((i) => {
      if (tab !== "all" && i.status !== tab) return false;
      if (q && ![i.name, i.creator, i.reference_code, i.description].some((f) => f?.toLowerCase().includes(q))) return false;
      if (year && i.year !== year) return false;
      if (condition && i.condition !== condition) return false;
      if (tag && !i.tags.some((t) => t.name === tag)) return false;
      const v = itemValue(i);
      if (min !== null && v < min) return false;
      if (max !== null && v > max) return false;
      return true;
    });
    const by: Record<Sort, (a: typeof list[number], b: typeof list[number]) => number> = {
      recent: (a, b) => b.created_at.localeCompare(a.created_at),
      oldest: (a, b) => a.created_at.localeCompare(b.created_at),
      name: (a, b) => a.name.localeCompare(b.name, "pt-BR"),
      high: (a, b) => itemValue(b) - itemValue(a),
      low: (a, b) => itemValue(a) - itemValue(b),
    };
    return [...list].sort(by[sort]);
  }, [items, tab, search, year, condition, tag, minPrice, maxPrice, sort]);

  if (isLoading) return <p className="text-center text-gray-600 dark:text-gray-400">Carregando...</p>;
  if (!collection) {
    return (
      <div className="text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">Coleção não encontrada.</p>
        <Link to="/collections" className="text-blue-600 dark:text-blue-400 hover:underline">← Voltar para Coleções</Link>
      </div>
    );
  }

  const s = summarize(items);
  const hasFilters = !!(search || year || condition || tag || minPrice || maxPrice);
  const clearFilters = () => {
    setSearch(""); setYear(""); setCondition(""); setTag(""); setMinPrice(""); setMaxPrice("");
  };

  const handleDelete = async () => {
    if (!window.confirm(`Excluir a coleção "${collection.name}" e todos os ${items.length} itens dela? Essa ação não pode ser desfeita.`)) return;
    try {
      await deleteCollection(collection);
      await Promise.all([qc.invalidateQueries({ queryKey: ["collections"] }), qc.invalidateQueries({ queryKey: ["items"] })]);
      navigate("/collections");
    } catch (e) {
      alert(errorMessage(e));
    }
  };

  const tabs: [Tab, string, number][] = [
    ["all", "Todos", items.length],
    ["owned", "Tenho", s.count],
    ["wishlist", "Wishlist", s.wishlist],
  ];

  return (
    <div className="space-y-6">
      <Link to="/collections" className="text-blue-600 dark:text-blue-400 hover:underline inline-block">← Coleções</Link>

      {/* Cabeçalho */}
      <div className={`${cardCls} p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-20 h-20 rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden flex items-center justify-center text-4xl shrink-0">
              {collection.cover_url ? <img src={collection.cover_url} alt="" className="w-full h-full object-cover" /> : categoryIcon(collection.category)}
            </div>
            <div className="min-w-0">
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white">{collection.name}</h2>
              <p className="text-gray-600 dark:text-gray-400">
                {s.count} {s.count === 1 ? "item" : "itens"} • {collection.category} •{" "}
                {collection.visibility === "public" ? "🌐 Pública" : "🔒 Privada"}
              </p>
              {collection.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{collection.description}</p>}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link to={`/collections/${collection.id}/items/new`} className={btnPrimary}>+ Adicionar item</Link>
            <Link to={`/collections/${collection.id}/edit`} className={btnGhost}>Editar</Link>
            <button onClick={handleDelete} className={btnDanger}>Excluir</button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {[
            ["Investido", money(s.invested), "text-teal-500"],
            ["Valor estimado", money(s.estimated), "text-orange-500"],
            ["Valorização", s.appreciation === null ? "—" : formatPercent(s.appreciation), s.difference >= 0 ? "text-green-500" : "text-red-500"],
            ["Wishlist", `${s.wishlist} ${s.wishlist === 1 ? "item" : "itens"}`, "text-rose-500"],
          ].map(([label, value, color]) => (
            <div key={label} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {collection.goal_count && (
          <div className="mt-5">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Progresso até o objetivo</p>
            <Progress value={s.count} total={collection.goal_count} color="bg-purple-500" />
          </div>
        )}
      </div>

      {/* Abas */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(([key, label, n]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              tab === key ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            {label} ({n})
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className={`${cardCls} p-4 space-y-3`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Pesquisar..." className={inputCls} />
          <select value={year} onChange={(e) => setYear(e.target.value)} className={inputCls}>
            <option value="">Ano: todos</option>
            {years.map((y) => <option key={y}>{y}</option>)}
          </select>
          <select value={condition} onChange={(e) => setCondition(e.target.value)} className={inputCls}>
            <option value="">Estado: todos</option>
            {conditions.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select value={tag} onChange={(e) => setTag(e.target.value)} className={inputCls}>
            <option value="">Tag: todas</option>
            {tags.map((t) => <option key={t} value={t}>#{t}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <input type="number" min="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Preço mín." className={`${inputCls} !w-32`} />
          <input type="number" min="0" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Preço máx." className={`${inputCls} !w-32`} />
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={`${inputCls} !w-auto`}>
            <option value="recent">Mais recentes</option>
            <option value="oldest">Mais antigos</option>
            <option value="name">Nome A-Z</option>
            <option value="high">Maior valor</option>
            <option value="low">Menor valor</option>
          </select>
          {hasFilters && <button onClick={clearFilters} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">Limpar filtros</button>}
          <div className="ml-auto flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
            {(["grid", "list"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                aria-label={v === "grid" ? "Grade" : "Lista"}
                className={`px-3 py-2 ${view === v ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}
              >
                {v === "grid" ? "▦" : "☰"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Itens */}
      {filtered.length === 0 ? (
        <div className={`${cardCls} p-12 text-center`}>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
            {items.length === 0 ? "Esta coleção ainda não tem itens" : "Nenhum item encontrado"}
          </p>
          {items.length === 0 && <Link to={`/collections/${collection.id}/items/new`} className={btnPrimary}>Adicionar primeiro item</Link>}
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((i) => <ItemGridCard key={i.id} item={i} />)}
        </div>
      ) : (
        <div className={`${cardCls} divide-y divide-gray-100 dark:divide-gray-700`}>
          {filtered.map((i) => <ItemListRow key={i.id} item={i} />)}
        </div>
      )}
    </div>
  );
}
