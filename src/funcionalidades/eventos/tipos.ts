import { z } from 'zod';

export const EventCategorySchema = z.enum([
  'MUSIC',
  'SPORTS',
  'TECHNOLOGY',
  'EDUCATION',
  'CULTURE',
  'ENTERTAINMENT',
]);

export type EventCategory = z.infer<typeof EventCategorySchema>;

export const EventStatusSchema = z.enum([
  'DRAFT',
  'PUBLISHED',
  'SOLD_OUT',
  'CANCELLED',
  'FINISHED',
]);

export type EventStatus = z.infer<typeof EventStatusSchema>;

export const TicketTypeSchema = z.enum(['GENERAL', 'VIP', 'BACKSTAGE', 'STUDENT']);

export type TicketType = z.infer<typeof TicketTypeSchema>;

export const EventoResumenSchema = z
  .object({
    id: z.number().optional(),
    eventCode: z.string(),
    name: z.string(),
    description: z.string().optional(),
    category: EventCategorySchema,
    status: EventStatusSchema,
    eventDate: z.string(),
    minimumAge: z.number().optional(),
    city: z.string().optional(),
    venueName: z.string().optional(),
    venueCode: z.string().optional(),
    artistNames: z.array(z.string()).optional(),
  })
  .passthrough();

export type EventoResumen = z.infer<typeof EventoResumenSchema>;

export const ArtistaEventoSchema = z
  .object({
    id: z.number().optional(),
    stageName: z.string(),
    genre: z.string().optional(),
  })
  .passthrough();

export const SedeEventoSchema = z
  .object({
    code: z.string().optional(),
    name: z.string(),
    city: z.string().optional(),
    capacity: z.number().optional(),
  })
  .passthrough();

export const EventoDetalleSchema = z
  .object({
    id: z.number().optional(),
    eventCode: z.string(),
    name: z.string(),
    description: z.string().optional().default(''),
    category: EventCategorySchema,
    status: EventStatusSchema,
    eventDate: z.string(),
    minimumAge: z.number().default(0),
    venueCode: z.string().optional(),
    venueName: z.string().optional(),
    venueCity: z.string().optional(),
    venueCapacity: z.number().optional(),
    venue: SedeEventoSchema.optional(),
    artists: z.array(ArtistaEventoSchema).optional(),
  })
  .passthrough();

export type EventoDetalle = z.infer<typeof EventoDetalleSchema>;

export const TicketCreadoSchema = z
  .object({
    ticketCode: z.string(),
    type: TicketTypeSchema.optional(),
    price: z.number().optional(),
    status: z.string().optional(),
    purchaseDate: z.string().optional(),
  })
  .passthrough();

export type TicketCreado = z.infer<typeof TicketCreadoSchema>;