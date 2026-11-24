import { API_URL } from '@/config';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ClientHooks {
  getToken: () => string | null;
  onUnauthorized: () => void;
}

let hooks: ClientHooks = { getToken: () => null, onUnauthorized: () => {} };

export function configureClient(next: ClientHooks): void {
  hooks = next;
}

interface RequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  auth?: boolean;
  /** O servidor gratuito pode levar cerca de 1 minuto para acordar. */
  timeoutMs?: number;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractMessage(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const body = data as { message?: unknown; errors?: { message?: string }[] };
  if (body.errors?.[0]?.message) return body.errors[0].message;
  if (typeof body.message === 'string') return body.message;
  if (Array.isArray(body.message) && typeof body.message[0] === 'string') return body.message[0];
  return null;
}

export async function request<T>(
  path: string,
  { method = 'GET', body, auth = true, timeoutMs = 75_000 }: RequestOptions = {},
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const token = auth ? hooks.getToken() : null;

  try {
    const response = await fetch(`${API_URL}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    const data = text ? parseJson(text) : null;

    if (!response.ok) {
      if (response.status === 401 && auth) hooks.onUnauthorized();
      throw new ApiError(extractMessage(data) ?? `Erro ${response.status}`, response.status);
    }
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('O servidor demorou para responder. Tente novamente.', 0);
    }
    throw new ApiError('Sem conexão com o servidor.', 0);
  } finally {
    clearTimeout(timer);
  }
}

/** Acorda o servidor gratuito enquanto o app abre. */
export function warmUp(): void {
  fetch(`${API_URL}/health`).catch(() => {});
}
