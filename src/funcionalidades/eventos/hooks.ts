import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { http } from '../../lib/http';
import {
  EventoDetalleSchema,
  EventoResumenSchema,
  TicketCreadoSchema,
  type EventoDetalle,
  type EventoResumen,
  type TicketCreado,
  type TicketType,
} from './tipos';

const ListaEventosSchema = z.array(EventoResumenSchema);

export function useEventosPublicados() {
  return useQuery<EventoResumen[]>({
    queryKey: ['eventos', 'publicados'],
    staleTime: 60_000,
    queryFn: async () => {
      const raw = await http<unknown>('/events/published');
      return ListaEventosSchema.parse(raw);
    },
  });
}

export function useEventosPorArtista(stageName: string) {
  const trimmed = stageName.trim();
  return useQuery<EventoResumen[]>({
    queryKey: ['eventos', 'artista', trimmed],
    staleTime: 60_000,
    enabled: trimmed.length > 0,
    queryFn: async () => {
      const params = new URLSearchParams({ stageName: trimmed });
      const raw = await http<unknown>(`/events/by-artist?${params.toString()}`);
      return ListaEventosSchema.parse(raw);
    },
  });
}

export function useEventoDetalle(eventCode: string | undefined) {
  return useQuery<EventoDetalle>({
    queryKey: ['evento', eventCode],
    staleTime: 30_000,
    enabled: Boolean(eventCode),
    queryFn: async () => {
      const raw = await http<unknown>(`/events/${encodeURIComponent(eventCode!)}`);
      return EventoDetalleSchema.parse(raw);
    },
  });
}

interface ComprarTicketPayload {
  userEmail: string;
  eventCode: string;
  type: TicketType;
}

export function useComprarTicket() {
  const queryClient = useQueryClient();

  return useMutation<TicketCreado, unknown, ComprarTicketPayload>({
    mutationFn: async (payload) => {
      const raw = await http<unknown>('/tickets', {
        method: 'POST',
        data: payload,
      });
      return TicketCreadoSchema.parse(raw);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tickets', 'usuario', variables.userEmail] });
      queryClient.invalidateQueries({ queryKey: ['evento', variables.eventCode] });
    },
  });
}