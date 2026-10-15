import { Link } from "react-router-dom";
import type { Collection, Item } from "../../types";
import { categoryIcon, summarize } from "../../lib/utils";
import { cardCls } from "../../lib/ui";
import { useMoney } from "../../hooks/useData";
import Progress from "../ui/Progress";

export default function CollectionCard({
  collection,
  items,
}: {
  collection: Collection;
  items: Item[];
}) {
  const money = useMoney();
  const s = summarize(items);

  return (
    <Link
      to={`/collections/${collection.id}`}
      className={`${cardCls} overflow-hidden block transition-transform hover:scale-[1.03]`}
    >
      <div className="h-36 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-6xl">
        {collection.cover_url ? (
          <img src={collection.cover_url} alt={collection.name} className="w-full h-full object-cover" />
        ) : (
          categoryIcon(collection.category)
        )}
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white line-clamp-2">
            {collection.name}
          </h3>
          <span className="shrink-0 bg-blue-600 text-white px-2 py-0.5 rounded-full text-xs font-medium">
            {collection.category}
          </span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {s.count} {s.count === 1 ? "item" : "itens"}
          {s.wishlist > 0 && ` • ❤️ ${s.wishlist}`}
        </p>
        <p className="text-sm font-medium text-green-600 dark:text-green-400">
          {money(s.invested)} investidos
        </p>
        {collection.goal_count && (
          <Progress value={s.count} total={collection.goal_count} color="bg-purple-500" />
        )}
      </div>
    </Link>
  );
}
