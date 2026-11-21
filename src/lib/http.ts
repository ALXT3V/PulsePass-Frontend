import { z } from 'zod';

const ErrorResponseSchema = z.object({
  timestamp: z.string().optional(),
  status: z.number(),
  error: z.string().optional(),
  message: z.string(),
  details: z.record(z.string(), z.string()).optional(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

export class ApiError extends Error {
  public status: number;
  public details: Record<string, string>;

  constructor(status: number, message: string, details: Record<string, string> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

const TOKEN_STORAGE_KEY = 'pulsepass_session_token';

let memoryToken: string | null = null;
let onUnauthorizedCallback: (() => void) | null = null;

export function setHttpToken(token: string | null): void {
  memoryToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      window.sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }
}

export function getHttpToken(): string | null {
  if (memoryToken) {
    return memoryToken;
  }
  if (typeof window !== 'undefined') {
    const stored = window.sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (stored) {
      memoryToken = stored;
      return stored;
    }
  }
  return null;
}

export function setOnUnauthorized(callback: (() => void) | null): void {
  onUnauthorizedCallback = callback;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  data?: unknown;
}

export async function http<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { data, headers, ...customOptions } = options;

  const token = getHttpToken();
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL.replace(/\/$/, '')}${normalizedEndpoint}`;

  const mergedHeaders = new Headers(headers);
  if (data !== undefined && !mergedHeaders.has('Content-Type')) {
    mergedHeaders.set('Content-Type', 'application/json');
  }
  if (token && !mergedHeaders.has('Authorization')) {
    mergedHeaders.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...customOptions,
      headers: mergedHeaders,
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  } catch {
    throw new ApiError(0, 'No pudimos conectar con el servidor.');
  }

  let parsedBody: unknown = null;
  if (response.status !== 204) {
    const text = await response.text();
    if (text) {
      try {
        parsedBody = JSON.parse(text);
      } catch {
        parsedBody = null;
      }
    }
  }

  if (!response.ok) {
    if (response.status === 401 && normalizedEndpoint !== '/auth/login') {
      setHttpToken(null);
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      } else if (typeof window !== 'undefined') {
        window.location.assign('/login');
      }
    }

    const parsedError = ErrorResponseSchema.safeParse(parsedBody);
    if (parsedError.success) {
      throw new ApiError(
        parsedError.data.status,
        parsedError.data.message,
        parsedError.data.details ?? {}
      );
    }

    const fallbackMessage =
      response.status >= 500
        ? 'Ocurrió un error inesperado. Inténtalo más tarde.'
        : 'La solicitud no pudo completarse.';

    throw new ApiError(response.status, fallbackMessage, {});
  }

  return parsedBody as T;
}