import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { http, setHttpToken, getHttpToken, setOnUnauthorized } from '../../lib/http';
import {
  LoginResponseSchema,
  UsuarioAutenticadoSchema,
  type Rol,
  type Sesion,
  type UsuarioAutenticado,
} from './tipos';

const EXPIRATION_STORAGE_KEY = 'pulsepass_session_expires_at';
const DEFAULT_EXPIRATION_SECONDS = 900;

interface AuthContextValue {
  sesion: Sesion;
  iniciarSesion: (identifier: string, password: string) => Promise<void>;
  cerrarSesion: (redirigirLogin?: boolean, motivo?: string) => void;
  tieneRol: (...roles: Rol[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function leerExpiracionGuardada(): number | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const raw = window.sessionStorage.getItem(EXPIRATION_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function guardarExpiracion(expiraEn: number | null): void {
  if (typeof window === 'undefined') {
    return;
  }
  if (expiraEn) {
    window.sessionStorage.setItem(EXPIRATION_STORAGE_KEY, String(expiraEn));
  } else {
    window.sessionStorage.removeItem(EXPIRATION_STORAGE_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [sesion, setSesion] = useState<Sesion>({ estado: 'cargando' });

  const limpiarEstadoLocal = useCallback(() => {
    setHttpToken(null);
    guardarExpiracion(null);
    queryClient.clear();
    setSesion({ estado: 'anonimo' });
  }, [queryClient]);

  const cerrarSesion = useCallback(
    (redirigirLogin = false, motivo?: string) => {
      limpiarEstadoLocal();
      if (typeof window !== 'undefined') {
        if (redirigirLogin) {
          window.history.replaceState({ motivo }, '', '/login');
          window.location.assign('/login');
        } else {
          window.location.assign('/');
        }
      }
    },
    [limpiarEstadoLocal]
  );

  useEffect(() => {
    setOnUnauthorized(() => {
      limpiarEstadoLocal();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.history.replaceState({ motivo: 'expirada' }, '', '/login');
        window.location.assign('/login');
      }
    });
    return () => {
      setOnUnauthorized(null);
    };
  }, [limpiarEstadoLocal]);

  useEffect(() => {
    let cancelado = false;

    async function restaurarSesion() {
      const token = getHttpToken();
      const expiraEn = leerExpiracionGuardada();

      if (!token || !expiraEn || Date.now() >= expiraEn) {
        setHttpToken(null);
        guardarExpiracion(null);
        if (!cancelado) {
          setSesion({ estado: 'anonimo' });
        }
        return;
      }

      try {
        const rawMe = await http<unknown>('/auth/me');
        const parsedUser = UsuarioAutenticadoSchema.safeParse(rawMe);
        if (!parsedUser.success) {
          throw new Error('Perfil inválido');
        }
        if (!cancelado) {
          setSesion({
            estado: 'autenticado',
            token,
            expiraEn,
            usuario: parsedUser.data,
          });
        }
      } catch {
        setHttpToken(null);
        guardarExpiracion(null);
        if (!cancelado) {
          setSesion({ estado: 'anonimo' });
        }
      }
    }

    restaurarSesion();

    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    if (sesion.estado !== 'autenticado') {
      return;
    }
    const restante = sesion.expiraEn - Date.now();
    if (restante <= 0) {
      cerrarSesion(true, 'expirada');
      return;
    }
    const timer = window.setTimeout(() => {
      cerrarSesion(true, 'expirada');
    }, restante);

    return () => {
      window.clearTimeout(timer);
    };
  }, [sesion, cerrarSesion]);

  const iniciarSesion = useCallback(async (identifier: string, password: string) => {
    const rawLogin = await http<unknown>('/auth/login', {
      method: 'POST',
      data: { identifier, password },
    });

    const parsedLogin = LoginResponseSchema.safeParse(rawLogin);
    const token = parsedLogin.success
      ? parsedLogin.data.accessToken
      : typeof (rawLogin as { token?: unknown })?.token === 'string'
        ? (rawLogin as { token: string }).token
        : null;

    if (!token) {
      throw new Error('No se recibió un token válido del servidor.');
    }

    const expiresInSeconds =
      parsedLogin.success && parsedLogin.data.expiresIn
        ? parsedLogin.data.expiresIn
        : DEFAULT_EXPIRATION_SECONDS;
    const expiraEn = Date.now() + expiresInSeconds * 1000;

    setHttpToken(token);
    guardarExpiracion(expiraEn);

    const rawMe = await http<unknown>('/auth/me');
    const parsedUser = UsuarioAutenticadoSchema.safeParse(rawMe);
    const usuario: UsuarioAutenticado = parsedUser.success
      ? parsedUser.data
      : { email: identifier, roles: ['USER'] };

    setSesion({
      estado: 'autenticado',
      token,
      expiraEn,
      usuario,
    });
  }, []);

  const tieneRol = useCallback(
    (...roles: Rol[]) => {
      if (sesion.estado !== 'autenticado') {
        return false;
      }
      return roles.some((rol) => sesion.usuario.roles.includes(rol));
    },
    [sesion]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      sesion,
      iniciarSesion,
      cerrarSesion,
      tieneRol,
    }),
    [sesion, iniciarSesion, cerrarSesion, tieneRol]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return ctx;
}