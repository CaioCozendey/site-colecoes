import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { fetchCollections, fetchProfile } from "../services/collections";
import { fetchItems } from "../services/items";
import { formatMoney } from "../lib/utils";

export function useCollections() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["collections", user?.id],
    queryFn: fetchCollections,
    enabled: !!user,
  });
}

/** Todos os itens do usuário (com fotos e tags). Telas filtram no cliente. */
export function useItems() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["items", user?.id],
    queryFn: fetchItems,
    enabled: !!user,
  });
}

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user,
  });
}

/** Formatador de dinheiro na moeda padrão do usuário. */
export function useMoney() {
  const { data } = useProfile();
  const currency = data?.currency ?? "BRL";
  return (v: number | null | undefined) => formatMoney(v, currency);
}
