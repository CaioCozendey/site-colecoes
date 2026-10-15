import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { btnGhost, btnPrimary } from "../lib/ui";

const features = [
  ["📦", "Cadastre suas coleções"],
  ["📸", "Adicione fotos e informações"],
  ["💰", "Controle quanto gastou"],
  ["❤️", "Monte sua lista de desejos"],
  ["📈", "Acompanhe o crescimento da coleção"],
];

export default function Landing() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-xl text-center">
        <p className="text-6xl mb-4">🏺</p>
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-6">
          Organize tudo o que você coleciona.
        </h1>
        <ul className="text-left inline-block space-y-2 mb-8 text-gray-700 dark:text-gray-300">
          {features.map(([icon, text]) => (
            <li key={text} className="flex items-center gap-3 text-lg">
              <span>{icon}</span>
              {text}
            </li>
          ))}
        </ul>
        <div className="flex gap-3 justify-center">
          {user ? (
            <Link to="/dashboard" className={btnPrimary}>
              Ir para o dashboard
            </Link>
          ) : (
            <>
              <Link to="/register" className={btnPrimary}>
                Criar conta
              </Link>
              <Link to="/login" className={btnGhost}>
                Entrar
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
