import { z } from 'zod';

export const RolSchema = z.enum(['USER', 'STAFF', 'ADMIN']);
export type Rol = z.infer<typeof RolSchema>;

export const LoginResponseSchema = z.object({
  accessToken: z.string().min(1),
  tokenType: z.string().optional(),
  expiresIn: z.number().optional(),
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const UsuarioAutenticadoSchema = z
  .object({
    identificador: z.string().optional(),
    username: z.string().optional(),
    email: z.string().email(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    roles: z.array(RolSchema).default([]),
  })
  .passthrough();

export type UsuarioAutenticado = z.infer<typeof UsuarioAutenticadoSchema>;

export type Sesion =
  | { estado: 'cargando' }
  | { estado: 'anonimo' }
  | {
      estado: 'autenticado';
      token: string;
      expiraEn: number;
      usuario: UsuarioAutenticado;
    };