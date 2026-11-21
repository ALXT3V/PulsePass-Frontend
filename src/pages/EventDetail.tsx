import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useComprarTicket, useEventoDetalle } from '../funcionalidades/eventos/hooks';
import { TicketTypeSchema, type EventStatus, type TicketType } from '../funcionalidades/eventos/tipos';
import { useAuth } from '../funcionalidades/auth/AuthContext';
import { ApiError } from '../lib/http';
import { RUTAS } from '../lib/rutas';

const TIPOS_ENTRADA = TicketTypeSchema.options;

const BADGE_ESTILOS: Record<EventStatus, string> = {
  DRAFT: 'bg-slate-200 text-slate-700',
  PUBLISHED: 'bg-emerald-100 text-emerald-800',
  SOLD_OUT: 'bg-amber-100 text-amber-800',
  CANCELLED: 'bg-red-100 text-red-800',
  FINISHED: 'bg-slate-300 text-slate-800',
};

export function EventDetail() {
  const { eventCode } = useParams<{ eventCode: string }>();
  const navigate = useNavigate();
  const { sesion, tieneRol } = useAuth();

  const [selectedType, setSelectedType] = useState<TicketType>('GENERAL');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [avisoPagina, setAvisoPagina] = useState<string | null>(null);

  const { data: evento, isLoading, error, refetch } = useEventoDetalle(eventCode);
  const comprarMutation = useComprarTicket();

  const esAnonimo = sesion.estado === 'anonimo';
  const esStaffOAdmin = tieneRol('STAFF', 'ADMIN');
  const puedeComprar = evento?.status === 'PUBLISHED' && !esStaffOAdmin;

  const abrirProcesoCompra = () => {
    if (!evento) {
      return;
    }
    if (esAnonimo) {
      navigate(RUTAS.login, {
        state: { desde: RUTAS.eventoDetalle(evento.eventCode) },
      });
      return;
    }
    setModalError(null);
    setModalAbierto(true);
  };

  const confirmarCompra = async () => {
    if (!evento || sesion.estado !== 'autenticado') {
      return;
    }
    setModalError(null);
    try {
      const ticket = await comprarMutation.mutateAsync({
        userEmail: sesion.usuario.email,
        eventCode: evento.eventCode,
        type: selectedType,
      });
      setModalAbierto(false);
      navigate(RUTAS.confirmacionCompra(ticket.ticketCode));
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setModalError(err.message);
          return;
        }
        if (err.status === 403) {
          setModalAbierto(false);
          setAvisoPagina(err.message || 'No tienes permisos para realizar esta compra.');
          return;
        }
        setModalError(err.message);
        return;
      }
      setModalError('No se pudo completar la compra. Inténtalo más tarde.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 flex items-center justify-center p-4">
        <div aria-busy="true">Cargando detalles del evento...</div>
      </div>
    );
  }

  if (error || !evento) {
    const status = error instanceof ApiError ? error.status : undefined;
    const noDisponible = status === 404 || status === 403;

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-md w-full text-center space-y-4">
          <h1 className="text-xl font-bold">
            {noDisponible ? 'Evento no disponible' : 'No pudimos cargar el evento'}
          </h1>
          {!noDisponible && (
            <button
              type="button"
              onClick={() => refetch()}
              className="bg-marca-600 hover:bg-marca-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Reintentar
            </button>
          )}
          <div>
            <button
              type="button"
              onClick={() => navigate(RUTAS.eventos)}
              className="text-sm text-marca-600 dark:text-marca-400 hover:underline"
            >
              Volver a la cartelera
            </button>
          </div>
        </div>
      </div>
    );
  }

  const fechaFormateada = new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(evento.eventDate));

  const nombreSede = evento.venue?.name || evento.venueName || evento.venueCode || 'Sede por confirmar';
  const ciudadSede = evento.venue?.city || evento.venueCity || '';
  const capacidadSede = evento.venue?.capacity ?? evento.venueCapacity;
  const artistas = evento.artists ?? [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 px-4 pb-24 md:pb-8">
      <div className="max-w-5xl mx-auto">
        <button
          type="button"
          onClick={() => navigate(RUTAS.eventos)}
          className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-6 inline-block"
        >
          Volver a la cartelera
        </button>

        {avisoPagina && (
          <div
            role="alert"
            className="bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-200 rounded-xl p-4 mb-6 text-sm"
          >
            {avisoPagina}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="h-44 bg-marca-50 dark:bg-slate-800 flex items-center justify-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-marca-700 dark:text-marca-300">
                {evento.category}
              </span>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase text-marca-600 dark:text-marca-400">
                  {evento.category}
                </span>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${BADGE_ESTILOS[evento.status]}`}
                >
                  {evento.status}
                </span>
                <span className="text-xs font-mono text-slate-500">{evento.eventCode}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold">{evento.name}</h1>

              <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                <span>{fechaFormateada}</span>
                <span>Edad mínima: {evento.minimumAge}</span>
              </div>

              {evento.description && (
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{evento.description}</p>
              )}

              <div>
                <h2 className="text-base font-semibold mb-3">Artistas</h2>
                {artistas.length === 0 ? (
                  <p className="text-sm text-slate-500">Sin artistas asociados por el momento.</p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {artistas.map((artista, idx) => (
                      <div
                        key={artista.id ?? `${artista.stageName}-${idx}`}
                        className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg text-sm"
                      >
                        <span className="w-7 h-7 rounded-full bg-marca-600 text-white text-xs font-bold flex items-center justify-center">
                          {artista.stageName.slice(0, 2).toUpperCase()}
                        </span>
                        <span>{artista.stageName}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-base font-semibold mb-3">Sede</h2>
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                  <p className="font-semibold">{nombreSede}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {[ciudadSede, capacidadSede !== undefined ? `Capacidad ${capacidadSede}` : '']
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {!esStaffOAdmin && (
            <aside className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-bold">Entradas</h2>
              <p className="text-xs font-medium text-slate-500 uppercase">Tipo de entrada</p>

              <div className="space-y-2">
                {TIPOS_ENTRADA.map((tipo) => (
                  <label
                    key={tipo}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer text-sm font-medium ${
                      selectedType === tipo
                        ? 'border-marca-600 bg-marca-50/50 dark:bg-marca-950/30'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="tipoEntrada"
                      value={tipo}
                      checked={selectedType === tipo}
                      onChange={() => setSelectedType(tipo)}
                      className="accent-marca-600"
                    />
                    <span>{tipo}</span>
                  </label>
                ))}
              </div>

              <button
                type="button"
                disabled={!esAnonimo && !puedeComprar}
                onClick={abrirProcesoCompra}
                className="w-full bg-marca-600 hover:bg-marca-700 disabled:bg-slate-400 text-white py-3 px-4 rounded-xl font-medium text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-600"
              >
                {esAnonimo
                  ? 'Inicia sesión para comprar'
                  : evento.status === 'PUBLISHED'
                    ? 'Comprar entrada'
                    : `No disponible (${evento.status})`}
              </button>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                El precio lo define el sistema al confirmar.
              </p>
            </aside>
          )}
        </div>
      </div>

      {!esStaffOAdmin && (
        <div className="fixed bottom-0 inset-x-0 md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-3 z-30">
          <button
            type="button"
            disabled={!esAnonimo && !puedeComprar}
            onClick={abrirProcesoCompra}
            className="w-full bg-marca-600 hover:bg-marca-700 disabled:bg-slate-400 text-white py-3 px-4 rounded-xl font-medium text-sm"
          >
            {esAnonimo
              ? 'Inicia sesión para comprar'
              : evento.status === 'PUBLISHED'
                ? 'Comprar'
                : `No disponible (${evento.status})`}
          </button>
        </div>
      )}

      {modalAbierto && sesion.estado === 'autenticado' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-modal-compra"
          className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 id="titulo-modal-compra" className="text-lg font-bold">
                Confirmar compra
              </h2>
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-sm px-2 py-1"
              >
                Cerrar
              </button>
            </div>

            <div className="text-sm space-y-2 border-y border-slate-200 dark:border-slate-800 py-3">
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Evento</span>
                <span className="font-semibold text-right">{evento.name}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Tipo</span>
                <span className="font-semibold">{selectedType}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Cuenta</span>
                <span className="font-semibold">{sesion.usuario.email}</span>
              </div>
            </div>

            {modalError && (
              <div
                role="alert"
                className="bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-200 p-3 rounded-lg text-sm"
              >
                {modalError}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={comprarMutation.isPending}
                onClick={confirmarCompra}
                className="px-4 py-2 rounded-lg bg-marca-600 hover:bg-marca-700 disabled:opacity-50 text-white text-sm font-medium"
              >
                {comprarMutation.isPending ? 'Cargando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}