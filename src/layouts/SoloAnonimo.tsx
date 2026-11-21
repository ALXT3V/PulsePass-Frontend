import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../funcionalidades/auth/AuthContext';
import { RUTAS } from '../lib/rutas';

export function SoloAnonimo() {
  const { sesion } = useAuth();
  const location = useLocation();

  if (sesion.estado === 'cargando') {
    return null;
  }

  if (sesion.estado === 'autenticado') {
    const state = location.state as { desde?: string } | null;
    return <Navigate to={state?.desde || RUTAS.inicio} replace />;
  }

  return <Outlet />;
}