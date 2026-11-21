import { Link, Outlet } from 'react-router';

export function Layout() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Barra de navegación superior */}
      <nav className="bg-slate-800 border-b border-slate-700 px-8 py-4 flex justify-between items-center shadow-md">
        <Link to="/" className="font-extrabold text-xl text-marca-500 tracking-wide">
          PulsePass
        </Link>
        <div className="flex items-center space-x-6">
          <Link to="/" className="text-slate-300 hover:text-white transition-colors text-sm font-medium">
            Eventos
          </Link>
          <Link 
            to="/login" 
            className="bg-marca-600 hover:bg-marca-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Iniciar Sesión
          </Link>
        </div>
      </nav>

      {/* Contenido dinámico de las páginas */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
