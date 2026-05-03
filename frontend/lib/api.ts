import { getToken } from './auth';
import type {
  LoginResponse,
  MeResponse,
  Movie,
  Screening,
  ScreeningDetail,
  Reservation,
} from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

// ─── 공통 fetch 래퍼 ────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      body?.message ?? `Request failed with status ${res.status}`;
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }

  // 204 No Content 등 응답 본문 없는 경우
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

// ─── Auth ──────────────────────────────────────────────────────────────────

export function checkEmail(email: string): Promise<{ available: boolean }> {
  return request(`/auth/check-email?email=${encodeURIComponent(email)}`);
}

export function signup(body: {
  email: string;
  password: string;
  name: string;
}): Promise<MeResponse> {
  return request('/auth/signup', { method: 'POST', body: JSON.stringify(body) });
}

export function login(body: {
  email: string;
  password: string;
}): Promise<LoginResponse> {
  return request('/auth/login', { method: 'POST', body: JSON.stringify(body) });
}

export function resetPassword(body: {
  email: string;
  newPassword: string;
}): Promise<{ message: string }> {
  return request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function getMe(): Promise<MeResponse> {
  return request('/auth/me');
}

// ─── Movies ────────────────────────────────────────────────────────────────

export function getMovies(): Promise<Movie[]> {
  return request('/movies');
}

export function getMovie(id: number): Promise<Movie> {
  return request(`/movies/${id}`);
}

// ─── Screenings ────────────────────────────────────────────────────────────

export function getScreenings(movieId: number): Promise<Screening[]> {
  return request(`/screenings?movieId=${movieId}`);
}

export function getScreeningDetail(id: number): Promise<ScreeningDetail> {
  return request(`/screenings/${id}`);
}

// ─── Reservations ──────────────────────────────────────────────────────────

export function createReservation(body: {
  screeningId: number;
  seatIds: number[];
}): Promise<Reservation> {
  return request('/reservations', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function getReservations(): Promise<Reservation[]> {
  return request('/reservations');
}

export function cancelReservation(id: number): Promise<void> {
  return request(`/reservations/${id}/cancel`, { method: 'PATCH' });
}
