import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router';
import { http, ApiError } from '../lib/http';
import { RUTAS } from '../lib/rutas';

const registerSchema = z.object({
  username: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres'),
  email: z.string().email('Ingresa un correo electrónico válido'),
  firstName: z.string().min(2, 'El nombre es requerido'),
  lastName: z.string().min(2, 'El apellido es requerido'),
  birthDate: z
    .string()
    .min(1, 'La fecha de nacimiento es requerida')
    .refine((date) => !isNaN(Date.parse(date)), 'Fecha de nacimiento inválida')
    .refine((date) => new Date(date) <= new Date(), 'La fecha no puede ser futura'),
  city: z.string().min(2, 'La ciudad es obligatoria'),
  phone: z.string().min(7, 'El número de teléfono es obligatorio'),
  password: z
    .string()
    .min(12, 'La contraseña debe tener al menos 12 caracteres')
    .refine(
      (pwd) => new TextEncoder().encode(pwd).length <= 72,
      'La contraseña no puede superar los 72 bytes'
    ),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function Register() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await http('/users', {
        method: 'POST',
        data,
      });

      navigate(RUTAS.login, { state: { registrado: true } });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 400 && err.details) {
          Object.entries(err.details).forEach(([field, message]) => {
            if (
              field === 'username' ||
              field === 'email' ||
              field === 'firstName' ||
              field === 'lastName' ||
              field === 'birthDate' ||
              field === 'city' ||
              field === 'phone' ||
              field === 'password'
            ) {
              setError(field, { message });
            }
          });
          if (!Object.keys(err.details).length) {
            setError('root', { message: err.message });
          }
          return;
        }
        if (err.status === 409) {
          setError('root', { message: 'El usuario o correo ya está registrado.' });
          return;
        }
        setError('root', { message: err.message });
        return;
      }
      setError('root', { message: 'Ocurrió un error al registrar el usuario en el servidor.' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-lg w-full shadow-xl">
        <h1 className="text-2xl font-bold text-marca-500 mb-2">Crea tu cuenta</h1>
        <p className="text-slate-400 text-sm mb-6">Regístrate en PulsePass para empezar a comprar tus entradas.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Nombres</label>
              <input
                type="text"
                {...register('firstName')}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-marca-500"
                placeholder="Tu nombre"
              />
              {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Apellidos</label>
              <input
                type="text"
                {...register('lastName')}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-marca-500"
                placeholder="Tu apellido"
              />
              {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Nombre de usuario</label>
            <input
              type="text"
              autoComplete="username"
              {...register('username')}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-marca-500"
              placeholder="usuario123"
            />
            {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Correo electrónico</label>
            <input
              type="email"
              {...register('email')}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-marca-500"
              placeholder="tu@correo.com"
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Ciudad</label>
              <input
                type="text"
                {...register('city')}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-marca-500"
                placeholder="Santa Marta"
              />
              {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Teléfono</label>
              <input
                type="tel"
                {...register('phone')}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-marca-500"
                placeholder="3001234567"
              />
              {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Fecha de nacimiento</label>
              <input
                type="date"
                {...register('birthDate')}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-marca-500"
              />
              {errors.birthDate && <p className="text-red-400 text-xs mt-1">{errors.birthDate.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Contraseña (mín. 12 caracteres)</label>
              <input
                type="password"
                autoComplete="new-password"
                {...register('password')}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-marca-500"
                placeholder="Entre 12 caracteres y 72 bytes"
              />
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>
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
            className="w-full bg-marca-600 hover:bg-marca-700 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50 mt-4"
          >
            {isSubmitting ? 'Cargando...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-4">
          ¿Ya tienes una cuenta?{' '}
          <Link to={RUTAS.login} className="text-marca-400 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}