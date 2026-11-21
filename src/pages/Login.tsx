import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation, Link } from 'react-router';
import { useAuth } from '../funcionalidades/auth/AuthContext';
import { ApiError } from '../lib/http';
import { RUTAS } from '../lib/rutas';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Ingresa tu usuario o correo'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { iniciarSesion } = useAuth();

  const state = location.state as { desde?: string; registrado?: boolean; motivo?: string } | null;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await iniciarSesion(data.identifier, data.password);
      navigate(state?.desde || RUTAS.inicio, { replace: true });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 400 && err.details) {
          Object.entries(err.details).forEach(([field, message]) => {
            if (field === 'identifier' || field === 'password') {
              setError(field, { message });
            }
          });
          if (!Object.keys(err.details).length) {
            setError('root', { message: err.message });
          }
          return;
        }
        if (err.status === 401) {
          setError('root', { message: 'Credenciales inválidas.' });
          return;
        }
        setError('root', { message: err.message });
        return;
      }
      setError('root', { message: 'Inténtalo más tarde.' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-xl">
        <h1 className="text-2xl font-bold text-marca-500 mb-2">Inicia sesión</h1>
        <p className="text-slate-400 text-sm mb-6">Accede a tu cuenta de PulsePass para gestionar tus entradas.</p>

        {state?.registrado && (
          <div className="bg-emerald-900/50 border border-emerald-500 text-emerald-200 p-3 rounded-lg text-sm mb-4">
            Cuenta creada, inicia sesión.
          </div>
        )}

        {state?.motivo === 'expirada' && (
          <div className="bg-amber-900/50 border border-amber-500 text-amber-200 p-3 rounded-lg text-sm mb-4">
            Tu sesión expiró. Inicia sesión de nuevo.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Usuario o correo
            </label>
            <input
              type="text"
              autoComplete="username"
              {...register('identifier')}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-marca-500"
              placeholder="tu@correo.com o tu_usuario"
            />
            {errors.identifier && <p className="text-red-400 text-xs mt-1">{errors.identifier.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Contraseña</label>
            <input
              type="password"
              autoComplete="current-password"
              {...register('password')}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-marca-500"
              placeholder="••••••••••••"
            />
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>

          {errors.root && (
            <div
              role="alert"
              aria-live="polite"
              className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded-lg text-sm"
            >
              {errors.root.message}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-marca-600 hover:bg-marca-700 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Cargando...' : 'Ingresar'}
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-6">
          ¿No tienes cuenta?{' '}
          <Link to={RUTAS.registro} className="text-marca-400 font-medium hover:underline">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}