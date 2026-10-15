import { useEffect, useState, type ReactNode } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../services/supabase";
import { btnPrimary, errCls, inputCls, labelCls } from "../lib/ui";

function Shell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link to="/" className="block text-center text-5xl mb-2">🏺</Link>
          <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white">{title}</h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

const ErrorBox = ({ msg }: { msg: string | null }) =>
  msg ? (
    <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
      <p className="text-sm text-red-800 dark:text-red-200">{msg}</p>
    </div>
  ) : null;

const linkCls = "font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400";

/* ------------------------------ Login ------------------------------ */
const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
});

export function Login() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });

  if (user) return <Navigate to="/dashboard" replace />;

  const onSubmit = handleSubmit(async (v) => {
    setError(null);
    const res = await signIn(v.email, v.password);
    if (res.error) setError(res.error);
    else navigate("/dashboard");
  });

  return (
    <Shell title="🏺 Entrar" subtitle="Faça login para acessar suas coleções">
      <form onSubmit={onSubmit} className="space-y-6">
        <ErrorBox msg={error} />
        <div>
          <label className={labelCls}>E-mail</label>
          <input type="email" autoComplete="email" className={inputCls} placeholder="seu@email.com" {...register("email")} />
          {errors.email && <p className={errCls}>{errors.email.message}</p>}
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Senha</label>
            <Link to="/forgot-password" className="text-sm text-blue-600 dark:text-blue-400">Esqueceu a senha?</Link>
          </div>
          <input type="password" autoComplete="current-password" className={inputCls} placeholder="••••••••" {...register("password")} />
          {errors.password && <p className={errCls}>{errors.password.message}</p>}
        </div>
        <button type="submit" disabled={isSubmitting} className={`${btnPrimary} w-full py-3`}>
          {isSubmitting ? "Entrando..." : "Entrar"}
        </button>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Não tem uma conta? <Link to="/register" className={linkCls}>Criar conta</Link>
        </p>
      </form>
    </Shell>
  );
}

/* ----------------------------- Register ---------------------------- */
const registerSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome"),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .refine((v) => v === "" || /^[a-z0-9_]{3,30}$/.test(v), "3 a 30 caracteres: letras, números e _"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

export function Register() {
  const { user, signUp } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
  });

  if (user) return <Navigate to="/dashboard" replace />;

  const onSubmit = handleSubmit(async (v) => {
    setError(null);
    const res = await signUp(v);
    if (res.error) setError(res.error);
    else if (res.needsConfirmation) setConfirm(true);
    else navigate("/dashboard");
  });

  if (confirm) {
    return (
      <Shell title="📬 Confirme seu e-mail" subtitle="Quase lá!">
        <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4 text-sm text-green-800 dark:text-green-200">
          Enviamos um link de confirmação para o seu e-mail. Depois de confirmar, faça login.
          <div className="mt-4 text-center">
            <Link to="/login" className={linkCls}>Ir para o login</Link>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell title="🏺 Criar Conta" subtitle="Comece a organizar suas coleções">
      <form onSubmit={onSubmit} className="space-y-5">
        <ErrorBox msg={error} />
        <div>
          <label className={labelCls}>Nome</label>
          <input className={inputCls} autoComplete="name" {...register("name")} />
          {errors.name && <p className={errCls}>{errors.name.message}</p>}
        </div>
        <div>
          <label className={labelCls}>Username (opcional)</label>
          <input className={inputCls} placeholder="caio_cozendey" autoComplete="username" {...register("username")} />
          {errors.username && <p className={errCls}>{errors.username.message}</p>}
        </div>
        <div>
          <label className={labelCls}>E-mail</label>
          <input type="email" className={inputCls} autoComplete="email" placeholder="seu@email.com" {...register("email")} />
          {errors.email && <p className={errCls}>{errors.email.message}</p>}
        </div>
        <div>
          <label className={labelCls}>Senha</label>
          <input type="password" className={inputCls} autoComplete="new-password" placeholder="••••••••" {...register("password")} />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Mínimo de 6 caracteres</p>
          {errors.password && <p className={errCls}>{errors.password.message}</p>}
        </div>
        <button type="submit" disabled={isSubmitting} className={`${btnPrimary} w-full py-3`}>
          {isSubmitting ? "Criando conta..." : "Criar Conta"}
        </button>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Já tem uma conta? <Link to="/login" className={linkCls}>Fazer login</Link>
        </p>
      </form>
    </Shell>
  );
}

/* -------------------------- Forgot password ------------------------ */
const emailSchema = z.object({ email: z.string().email("E-mail inválido") });

export function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
  });

  const onSubmit = handleSubmit(async (v) => {
    setError(null);
    const res = await resetPassword(v.email);
    if (res.error) setError(res.error);
    else setSent(true);
  });

  return (
    <Shell title="🔑 Recuperar Senha" subtitle="Enviaremos um link para redefinir sua senha">
      {sent ? (
        <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4 text-sm text-green-800 dark:text-green-200">
          ✅ E-mail enviado! Verifique sua caixa de entrada (e o spam).
          <div className="mt-4 text-center"><Link to="/login" className={linkCls}>Voltar para o login</Link></div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-6">
          <ErrorBox msg={error} />
          <div>
            <label className={labelCls}>E-mail</label>
            <input type="email" className={inputCls} placeholder="seu@email.com" {...register("email")} />
            {errors.email && <p className={errCls}>{errors.email.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className={`${btnPrimary} w-full py-3`}>
            {isSubmitting ? "Enviando..." : "Enviar link de recuperação"}
          </button>
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Lembrou a senha? <Link to="/login" className={linkCls}>Fazer login</Link>
          </p>
        </form>
      )}
    </Shell>
  );
}

/* --------------------------- Reset password ------------------------ */
const resetSchema = z.object({ password: z.string().min(6, "Mínimo de 6 caracteres") });

export function ResetPassword() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof resetSchema>>({
    resolver: zodResolver(resetSchema),
  });

  // O link do e-mail cria uma sessão de recuperação automaticamente
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const onSubmit = handleSubmit(async (v) => {
    setError(null);
    const res = await updatePassword(v.password);
    if (res.error) setError(res.error);
    else navigate("/dashboard");
  });

  return (
    <Shell title="🔑 Nova senha" subtitle="Escolha uma nova senha para sua conta">
      {!ready ? (
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Abra esta página pelo link enviado ao seu e-mail.{" "}
          <Link to="/forgot-password" className={linkCls}>Pedir novo link</Link>
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-6">
          <ErrorBox msg={error} />
          <div>
            <label className={labelCls}>Nova senha</label>
            <input type="password" autoComplete="new-password" className={inputCls} {...register("password")} />
            {errors.password && <p className={errCls}>{errors.password.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className={`${btnPrimary} w-full py-3`}>
            {isSubmitting ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>
      )}
    </Shell>
  );
}
