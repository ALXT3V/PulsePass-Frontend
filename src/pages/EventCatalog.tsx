import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';
import {
  useEventosPorArtista,
  useEventosPublicados,
} from '../funcionalidades/eventos/hooks';
import {
  EventCategorySchema,
  type EventCategory,
  type EventStatus,
} from '../funcionalidades/eventos/tipos';
import { RUTAS } from '../lib/rutas';

const BADGE_ESTILOS: Record<EventStatus, string> = {
  DRAFT: 'bg-slate-200 text-slate-700',
  PUBLISHED: 'bg-emerald-100 text-emerald-800',
  SOLD_OUT: 'bg-amber-100 text-amber-800',
  CANCELLED: 'bg-red-100 text-red-800',
  FINISHED: 'bg-slate-300 text-slate-800',
};

const CATEGORIAS = EventCategorySchema.options;

export function EventCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();

  const q = searchParams.get('q') ?? '';
  const categoriaRaw = searchParams.get('categoria') ?? '';
  const artista = searchParams.get('artista') ?? '';

  const categoriaValida = CATEGORIAS.includes(categoriaRaw as EventCategory)
    ? (categoriaRaw as EventCategory)
    : '';

  const publicadosQuery = useEventosPublicados();
  const porArtistaQuery = useEventosPorArtista(artista);

  const usaFiltroArtista = artista.trim().length > 0;
  const fuenteEventos = usaFiltroArtista ? porArtistaQuery.data : publicadosQuery.data;
  const isLoading = usaFiltroArtista ? porArtistaQuery.isLoading : publicadosQuery.isLoading;
  const isError = usaFiltroArtista ? porArtistaQuery.isError : publicadosQuery.isError;

  const eventosFiltrados = useMemo(() => {
    const lista = fuenteEventos ?? [];
    const texto = q.trim().toLowerCase();

    return lista.filter((ev) => {
      const coincideTexto = !texto || ev.name.toLowerCase().includes(texto);
      const coincideCategoria = !categoriaValida || ev.category === categoriaValida;
      return coincideTexto && coincideCategoria;
    });
  }, [fuenteEventos, q, categoriaValida]);

  const actualizarParametro = (clave: 'q' | 'categoria' | 'artista', valor: string) => {
    const siguiente = new URLSearchParams(searchParams);
    if (valor.trim()) {
      siguiente.set(clave, valor);
    } else {
      siguiente.delete(clave);
    }
    setSearchParams(siguiente);
  };

  const limpiarFiltros = () => {
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Cartelera</h1>
        </header>

        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label htmlFor="filtro-nombre" className="block text-sm font-medium mb-1">
              Buscar por nombre
            </label>
            <input
              id="filtro-nombre"
              type="text"
              value={q}
              onChange={(e) => actualizarParametro('q', e.target.value)}
              placeholder="Buscar por nombre..."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-600"
            />
          </div>

          <div>
            <label htmlFor="filtro-categoria" className="block text-sm font-medium mb-1">
              Categoría
            </label>
            <select
              id="filtro-categoria"
              value={categoriaValida}
              onChange={(e) => actualizarParametro('categoria', e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-600"
            >
              <option value="">Todas</option>
              {CATEGORIAS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filtro-artista" className="block text-sm font-medium mb-1">
              Artista
            </label>
            <input
              id="filtro-artista"
              type="text"
              value={artista}
              onChange={(e) => actualizarParametro('artista', e.target.value)}
              placeholder="Todos (nombre artístico)"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-600"
            />
          </div>

          <div>
            <button
              type="button"
              onClick={limpiarFiltros}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-600"
            >
              Limpiar
            </button>
          </div>
        </section>

        {isLoading && (
          <div aria-busy="true" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-52 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse"
              />
            ))}
          </div>
        )}

        {isError && (
          <div className="bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-200 rounded-xl p-6 text-center space-y-3">
            <p>No pudimos conectar con el servidor.</p>
            <button
              type="button"
              onClick={() => {
                if (usaFiltroArtista) {
                  porArtistaQuery.refetch();
                } else {
                  publicadosQuery.refetch();
                }
              }}
              className="bg-marca-600 hover:bg-marca-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Reintentar
            </button>
          </div>
        )}

        {!isLoading && !isError && eventosFiltrados.length === 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center text-slate-600 dark:text-slate-400">
            {q || categoriaValida || artista
              ? 'Sin resultados para tu búsqueda'
              : 'Aún no hay eventos publicados'}
          </div>
        )}

        {!isLoading && !isError && eventosFiltrados.length > 0 && (
          <>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              {eventosFiltrados.length} {eventosFiltrados.length === 1 ? 'evento' : 'eventos'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {eventosFiltrados.map((evento) => {
                const fechaTexto = new Intl.DateTimeFormat('es-CO', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                }).format(new Date(evento.eventDate));
                const ubicacion = evento.city || evento.venueName || evento.venueCode || 'Por confirmar';

                return (
                  <Link
                    key={evento.eventCode}
                    to={RUTAS.eventoDetalle(evento.eventCode)}
                    className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm hover:border-marca-500 transition-colors flex flex-col focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-600"
                  >
                    <div className="h-28 bg-marca-50 dark:bg-slate-800 flex items-center justify-center px-4">
                      <span className="text-xs font-semibold uppercase tracking-wider text-marca-700 dark:text-marca-300">
                        {evento.category}
                      </span>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wide text-marca-600 dark:text-marca-400">
                          {evento.category}
                        </span>
                        <h2 className="text-lg font-bold mt-1 group-hover:text-marca-600 transition-colors">
                          {evento.name}
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{fechaTexto}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{ubicacion}</p>
                      </div>

                      <div>
                        <span
                          className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${BADGE_ESTILOS[evento.status]}`}
                        >
                          {evento.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}