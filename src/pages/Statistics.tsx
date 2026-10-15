import { useMemo } from "react";
import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
  Bar, BarChart, Cell,
} from "recharts";
import { useCollections, useItems, useMoney } from "../hooks/useData";
import { categoryIcon, formatPercent, summarize } from "../lib/utils";
import { cardCls } from "../lib/ui";
import StatCard from "../components/statistics/StatCard";
import type { Item } from "../types";

const COLORS = ["#3B82F6", "#10B981", "#8B5CF6", "#F97316", "#EC4899", "#14B8A6", "#F59E0B", "#6366F1"];
const pad = (n: number) => String(n).padStart(2, "0");
const keyOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const labelOf = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
};

/** Itens acumulados por mês, a partir do created_at dos itens que tenho. */
function evolution(items: Item[]) {
  const owned = items.filter((i) => i.status === "owned");
  if (!owned.length) return [];
  const counts: Record<string, number> = {};
  owned.forEach((i) => {
    const k = keyOf(new Date(i.created_at));
    counts[k] = (counts[k] ?? 0) + 1;
  });
  const first = Object.keys(counts).sort()[0];
  let [y, m] = first.split("-").map(Number);
  const end = keyOf(new Date());
  const out: { name: string; itens: number }[] = [];
  let acc = 0;
  for (;;) {
    const k = `${y}-${pad(m)}`;
    acc += counts[k] ?? 0;
    out.push({ name: labelOf(k), itens: acc });
    if (k >= end) break;
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return out;
}

function tagDistribution(items: Item[]) {
  const counts: Record<string, number> = {};
  items.filter((i) => i.status === "owned").forEach((i) => i.tags.forEach((t) => { counts[t.name] = (counts[t.name] ?? 0) + 1; }));
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
}

export default function Statistics() {
  const money = useMoney();
  const { data: items = [], isLoading } = useItems();
  const { data: collections = [] } = useCollections();

  const s = summarize(items);
  const evo = useMemo(() => evolution(items), [items]);
  const byCollection = useMemo(
    () => collections.map((c) => ({ name: c.name, itens: items.filter((i) => i.collection_id === c.id && i.status === "owned").length })),
    [collections, items],
  );

  if (isLoading) return <p className="text-center text-gray-600 dark:text-gray-400">Carregando estatísticas...</p>;
  if (items.length === 0) {
    return (
      <p className="text-center text-gray-600 dark:text-gray-400">
        Adicione itens às suas coleções para ver as estatísticas aqui!
      </p>
    );
  }

  const positive = s.difference >= 0;

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white">📊 Estatísticas</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total de itens" value={s.count} icon="🏺" color="green" />
        <StatCard title="Coleções" value={collections.length} icon="📦" color="blue" />
        <StatCard title="Total investido" value={money(s.invested)} icon="💰" color="teal" />
        <StatCard title="Valor estimado" value={money(s.estimated)} icon="📈" color="orange" />
        <StatCard title="Diferença" value={`${positive ? "+" : ""}${money(s.difference)}`} icon={positive ? "⬆️" : "⬇️"} color={positive ? "green" : "rose"} />
        <StatCard
          title="Valorização"
          hint="(estimado − pago) ÷ pago"
          value={s.appreciation === null ? "—" : formatPercent(s.appreciation)}
          icon="🚀"
          color="purple"
        />
      </div>

      <div className={`${cardCls} p-6`}>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Evolução da coleção</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={evo} margin={{ left: 0, right: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
            <YAxis allowDecimals={false} />
            <Tooltip formatter={(v: number) => [`${v} itens`, "Total"]} />
            <Line type="monotone" dataKey="itens" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {byCollection.length > 0 && (
        <div className={`${cardCls} p-6`}>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Itens por coleção</h3>
          <ResponsiveContainer width="100%" height={Math.max(220, byCollection.length * 40)}>
            <BarChart data={byCollection} layout="vertical" margin={{ top: 8, right: 32, left: 16, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={160} interval={0} />
              <Tooltip formatter={(v: number) => [`${v} itens`, "Total"]} />
              <Bar dataKey="itens" radius={[0, 6, 6, 0]}>
                {byCollection.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <section>
        <h3 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">Por coleção</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {collections.map((c) => {
            const its = items.filter((i) => i.collection_id === c.id);
            const cs = summarize(its);
            const dist = tagDistribution(its);
            const max = dist[0]?.[1] ?? 1;
            return (
              <div key={c.id} className={`${cardCls} p-6`}>
                <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-3">
                  {categoryIcon(c.category)} {c.name}
                </h4>
                <dl className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div><dt className="text-gray-500 dark:text-gray-400">Itens</dt><dd className="font-bold text-gray-800 dark:text-white">{cs.count}</dd></div>
                  <div><dt className="text-gray-500 dark:text-gray-400">Investido</dt><dd className="font-bold text-gray-800 dark:text-white">{money(cs.invested)}</dd></div>
                  <div><dt className="text-gray-500 dark:text-gray-400">Valor estimado</dt><dd className="font-bold text-gray-800 dark:text-white">{money(cs.estimated)}</dd></div>
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">Valorização</dt>
                    <dd className={`font-bold ${cs.difference >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {cs.appreciation === null ? "—" : formatPercent(cs.appreciation)}
                    </dd>
                  </div>
                </dl>
                {dist.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Distribuição por tags</p>
                    {dist.map(([name, n], idx) => (
                      <div key={name} className="flex items-center gap-2 text-sm">
                        <span className="w-24 truncate text-gray-700 dark:text-gray-300">#{name}</span>
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                          <div className="h-2.5 rounded-full" style={{ width: `${(n / max) * 100}%`, background: COLORS[idx % COLORS.length] }} />
                        </div>
                        <span className="w-6 text-right text-gray-600 dark:text-gray-400">{n}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
