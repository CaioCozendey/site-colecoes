export default function StatCard({
  title,
  value,
  icon,
  hint,
  color = "blue",
}: {
  title: string;
  value: string | number;
  icon: string;
  hint?: string;
  color?: "blue" | "green" | "purple" | "orange" | "teal" | "rose" | "indigo";
}) {
  const map = {
    blue: ["bg-blue-50 dark:bg-blue-900/20", "bg-blue-500", "text-blue-500"],
    green: ["bg-green-50 dark:bg-green-900/20", "bg-green-500", "text-green-500"],
    purple: ["bg-purple-50 dark:bg-purple-900/20", "bg-purple-500", "text-purple-500"],
    orange: ["bg-orange-50 dark:bg-orange-900/20", "bg-orange-500", "text-orange-500"],
    teal: ["bg-teal-50 dark:bg-teal-900/20", "bg-teal-500", "text-teal-500"],
    rose: ["bg-rose-50 dark:bg-rose-900/20", "bg-rose-500", "text-rose-500"],
    indigo: ["bg-indigo-50 dark:bg-indigo-900/20", "bg-indigo-500", "text-indigo-500"],
  }[color];
  return (
    <div className={`${map[0]} rounded-xl shadow-md p-5 flex flex-col justify-between min-h-[130px] transition-all hover:scale-[1.02] hover:shadow-lg`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 truncate">{title}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 min-h-[16px] truncate">
            {hint ?? "\u00A0"}
          </p>
        </div>
        <div className={`flex-shrink-0 w-11 h-11 ${map[1]} rounded-full flex items-center justify-center text-xl shadow-sm`}>
          {icon}
        </div>
      </div>
      <p className={`text-2xl lg:text-3xl font-bold mt-3 break-words ${map[2]}`}>
        {typeof value === "number" ? value.toLocaleString("pt-BR") : value}
      </p>
    </div>
  );
}
