import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../funcionalidades/auth/AuthContext';
import { RUTAS } from '../lib/rutas';

export function RutaProtegida() {
  const { sesion } = useAuth();
  const location = useLocation();

  if (sesion.estado === 'cargando') {
    return <div className="p-8 text-center text-slate-400">Verificando sesión...</div>;
  }

  if (sesion.estado === 'anonimo') {
    return <Navigate to={RUTAS.login} replace state={{ desde: location.pathname }} />;
  }

  return <Outlet />;
}