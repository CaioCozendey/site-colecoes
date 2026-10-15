import { Link } from "react-router-dom";
import { useCollections, useItems, useMoney, useProfile } from "../hooks/useData";
import { useAuth } from "../contexts/AuthContext";
import { primaryImage, summarize, categoryIcon } from "../lib/utils";
import { btnGhost, cardCls } from "../lib/ui";
import StatCard from "../components/statistics/StatCard";
import CollectionCard from "../components/collections/CollectionCard";
import AddItemSelect from "../components/collections/AddItemSelect";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: collections = [], isLoading: l1 } = useCollections();
  const { data: items = [], isLoading: l2 } = useItems();
  const money = useMoney();

  if (l1 || l2) return <p className="text-center text-gray-600 dark:text-gray-400">Carregando...</p>;

  const s = summarize(items);
  const firstName = (profile?.name ?? user?.email ?? "").split(" ")[0].split("@")[0];
  const recent = items.filter((i) => i.status === "owned").slice(0, 5);
  const collectionName = (id: string) => collections.find((c) => c.id === id)?.name ?? "";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Olá, {firstName} 👋</h2>
        <div className="flex gap-2 flex-wrap">
          <Link to="/collections/new" className={btnGhost}>+ Nova coleção</Link>
          <AddItemSelect collections={collections} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard title="Coleções" value={collections.length} icon="📦" color="blue" />
        <StatCard title="Itens" value={s.count} icon="🏺" color="green" />
        <StatCard title="Investido" value={money(s.invested)} icon="💰" color="teal" />
        <StatCard title="Valor estimado" value={money(s.estimated)} icon="📈" color="orange" />
        <StatCard title="Wishlist" value={s.wishlist} icon="❤️" color="rose" />
      </div>

      <section>
        <h3 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">Suas coleções</h3>
        {collections.length === 0 ? (
          <div className={`${cardCls} p-10 text-center`}>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Você ainda não tem coleções.</p>
            <Link to="/collections/new" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
              Criar minha primeira coleção →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((c) => (
              <CollectionCard key={c.id} collection={c} items={items.filter((i) => i.collection_id === c.id)} />
            ))}
          </div>
        )}
      </section>

      {recent.length > 0 && (
        <section>
          <h3 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
            Itens adicionados recentemente
          </h3>
          <div className={`${cardCls} divide-y divide-gray-100 dark:divide-gray-700`}>
            {recent.map((item) => {
              const img = primaryImage(item);
              return (
                <Link key={item.id} to={`/items/${item.id}`} className="flex items-center gap-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div className="w-14 h-14 rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden flex items-center justify-center text-2xl shrink-0">
                    {img ? <img src={img.image_url} alt="" className="w-full h-full object-cover" /> : "🏺"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-800 dark:text-white truncate">{item.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {categoryIcon(collections.find((c) => c.id === item.collection_id)?.category ?? "")}{" "}
                      {collectionName(item.collection_id)}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {item.purchase_price != null ? money(item.purchase_price) : ""}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
