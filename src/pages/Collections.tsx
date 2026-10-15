import { Link } from "react-router-dom";
import { useCollections, useItems } from "../hooks/useData";
import { btnPrimary, cardCls } from "../lib/ui";
import CollectionCard from "../components/collections/CollectionCard";

export default function Collections() {
  const { data: collections = [], isLoading } = useCollections();
  const { data: items = [] } = useItems();

  if (isLoading) return <p className="text-center text-gray-600 dark:text-gray-400">Carregando...</p>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
          Minhas Coleções ({collections.length})
        </h2>
        <Link to="/collections/new" className={btnPrimary}>+ Nova coleção</Link>
      </div>

      {collections.length === 0 ? (
        <div className={`${cardCls} p-12 text-center`}>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">Nenhuma coleção ainda</p>
          <Link to="/collections/new" className={btnPrimary}>Criar primeira coleção</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((c) => (
            <CollectionCard key={c.id} collection={c} items={items.filter((i) => i.collection_id === c.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
