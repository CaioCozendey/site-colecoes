import { NavLink, Outlet, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useProfile } from "../../hooks/useData";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: "🏠" },
  { to: "/collections", label: "Coleções", icon: "📦" },
  { to: "/wishlist", label: "Wishlist", icon: "❤️" },
  { to: "/statistics", label: "Estatísticas", icon: "📊" },
];

const desktopLink = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors ${
    isActive
      ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
  }`;

const mobileLink = ({ isActive }: { isActive: boolean }) =>
  `flex-1 flex flex-col items-center py-2 text-xs font-medium ${
    isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"
  }`;

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const { dark, toggle } = useTheme();
  const { data: profile } = useProfile();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 flex-col bg-white dark:bg-gray-800 shadow-md p-4">
        <Link to="/dashboard" className="text-2xl font-bold text-gray-800 dark:text-white px-2 mb-6">
          🏺 Coleções
        </Link>

        <nav className="space-y-1 flex-1">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} className={desktopLink}>
              <span>{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-1">
          <NavLink to="/settings" className={desktopLink}>
            <span>⚙️</span> Configurações
          </NavLink>
          <button
            onClick={toggle}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <span>{dark ? "☀️" : "🌙"}</span> {dark ? "Modo claro" : "Modo escuro"}
          </button>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <span>🚪</span> Sair
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-400 px-4 pt-2 truncate">
            {profile?.name ?? user?.email}
          </p>
        </div>
      </aside>

      {/* Conteúdo */}
      <main className="md:pl-64 pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Outlet />
        </div>
      </main>

      {/* Menu inferior (celular) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 flex bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        {nav.map((n) => (
          <NavLink key={n.to} to={n.to} className={mobileLink}>
            <span className="text-xl">{n.icon}</span>
            {n.label}
          </NavLink>
        ))}
        <NavLink to="/settings" className={mobileLink}>
          <span className="text-xl">👤</span>
          Perfil
        </NavLink>
      </nav>
    </div>
  );
}
