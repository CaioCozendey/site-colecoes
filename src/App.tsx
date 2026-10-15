import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { isConfigured } from "./services/supabase";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import Landing from "./pages/Landing";
import { Login, Register, ForgotPassword, ResetPassword } from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Collections from "./pages/Collections";
import CollectionForm from "./pages/CollectionForm";
import CollectionDetails from "./pages/CollectionDetails";
import ItemForm from "./pages/ItemForm";
import ItemDetails from "./pages/ItemDetails";
import Wishlist from "./pages/Wishlist";
import Statistics from "./pages/Statistics";
import Settings from "./pages/Settings";

function MissingConfig() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-lg bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
          ⚙️ Configure o Supabase
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-3">
          Copie <code>.env.example</code> para <code>.env</code> e preencha{" "}
          <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code>. Depois reinicie o
          servidor (<code>npm run dev</code>).
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          O passo a passo completo está no README.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  if (!isConfigured) {
    return (
      <ThemeProvider>
        <MissingConfig />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/collections" element={<Collections />} />
                <Route path="/collections/new" element={<CollectionForm />} />
                <Route path="/collections/:id" element={<CollectionDetails />} />
                <Route path="/collections/:id/edit" element={<CollectionForm />} />
                <Route path="/collections/:collectionId/items/new" element={<ItemForm />} />
                <Route path="/items/:id" element={<ItemDetails />} />
                <Route path="/items/:id/edit" element={<ItemForm />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/statistics" element={<Statistics />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
