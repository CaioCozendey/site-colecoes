import { Link } from "react-router-dom";
import type { Item } from "../../types";
import { PRIORITY_LABEL, PRIORITY_STYLE, primaryImage } from "../../lib/utils";
import { cardCls } from "../../lib/ui";
import { useMoney } from "../../hooks/useData";

function useDisplayPrice() {
  const money = useMoney();
  return (i: Item) =>
    i.status === "wishlist"
      ? i.desired_price != null ? `Desejado: ${money(i.desired_price)}` : ""
      : i.estimated_value != null || i.purchase_price != null
        ? money(i.estimated_value ?? i.purchase_price)
        : "";
}

const Thumb = ({ item, className }: { item: Item; className: string }) => {
  const img = primaryImage(item);

  // Busca a segunda imagem pela ordem de cadastro
  const secondImg = item.item_images
    .filter((i) => i.id !== img?.id)
    .sort((a, b) => a.sort_order - b.sort_order)[0];

  return (
    <div
      className={`${className} bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden relative`}
    >
      {img ? (
        <>
          {/* Primeira imagem */}
          <img
            src={img.image_url}
            alt={item.name}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              secondImg ? "group-hover:opacity-0" : ""
            }`}
          />

          {/* Segunda imagem */}
          {secondImg && (
            <img
              src={secondImg.image_url}
              alt={`${item.name} - segunda imagem`}
              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            />
          )}
        </>
      ) : (
        <span className="text-5xl text-gray-400">🏺</span>
      )}
    </div>
  );
};

const WishBadge = ({ item }: { item: Item }) =>
  item.status === "wishlist" ? (
    <span className="bg-rose-600 text-white px-2 py-0.5 rounded-full text-xs font-medium">❤️ Wishlist</span>
  ) : null;

export function ItemGridCard({ item }: { item: Item }) {
  const price = useDisplayPrice();
  return (
    <Link
  to={`/items/${item.id}`}
  className={`${cardCls} group overflow-hidden block transition-transform hover:scale-[1.03]`}
>
      <div className="relative">
        <Thumb item={item} className="h-48" />
        <div className="absolute top-2 left-2"><WishBadge item={item} /></div>
        {item.status === "wishlist" && item.priority && (
          <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_STYLE[item.priority]}`}>
            {PRIORITY_LABEL[item.priority]}
          </span>
        )}
      </div>
      <div className="p-3 space-y-0.5">
        <h3 className="font-bold text-gray-800 dark:text-white line-clamp-2">{item.name}</h3>
        {item.year && <p className="text-sm text-gray-600 dark:text-gray-400">{item.year}</p>}
        {item.condition && <p className="text-sm text-gray-600 dark:text-gray-400">{item.condition}</p>}
        <p className="text-sm font-semibold text-green-600 dark:text-green-400 min-h-[20px]">{price(item)}</p>
      </div>
    </Link>
  );
}

export function ItemListRow({ item }: { item: Item }) {
  const price = useDisplayPrice();
  return (
    <Link to={`/items/${item.id}`} className="flex items-center gap-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50">
      <Thumb item={item} className="w-14 h-14 rounded-lg shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-gray-800 dark:text-white truncate">{item.name}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
          {[item.year, item.creator, item.condition].filter(Boolean).join(" • ")}
        </p>
      </div>
      <WishBadge item={item} />
      <p className="text-sm font-semibold text-green-600 dark:text-green-400 whitespace-nowrap">{price(item)}</p>
    </Link>
  );
}
