export default function Progress({
  value,
  total,
  color = "bg-blue-500",
}: {
  value: number;
  total: number;
  color?: string;
}) {
  const pct = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  return (
    <div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
        <div className={`${color} h-2.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-right">
        {value} de {total} • {pct.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
      </p>
    </div>
  );
}
