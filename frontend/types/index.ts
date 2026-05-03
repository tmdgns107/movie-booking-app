// ─── Auth ──────────────────────────────────────────────────────────────────

export interface LoginResponse {
  accessToken: string;
}

export interface MeResponse {
  id: number;
  email: string;
  name: string;
  createdAt: string;
}

// ─── Movie ─────────────────────────────────────────────────────────────────

export interface Movie {
  id: number;
  title: string;
  description: string;
  runningTime: number; // 분
  rating: string;      // ALL, 12, 15, 19
  posterUrl?: string;
  releaseDate: string;
}

// ─── Screening ─────────────────────────────────────────────────────────────

export interface Theater {
  id: number;
  name: string;
  totalRows: number;
  totalCols: number;
}

export interface Screening {
  id: number;
  movieId: number;
  theaterId: number;
  startTime: string;
  endTime: string;
  price: number;
  movie?: Pick<Movie, 'id' | 'title' | 'runningTime' | 'posterUrl' | 'rating'>;
  theater?: Pick<Theater, 'id' | 'name'>;
}

export interface SeatWithStatus {
  id: number;
  row: string;
  col: number;
  reserved: boolean; // 백엔드 응답 필드명과 일치
}

export interface ScreeningDetail {
  id: number;
  movieId: number;
  movie: Movie;
  startTime: string;
  endTime: string;
  price: number;
  theater: Theater;
  seats: SeatWithStatus[];
}

// ─── Reservation ───────────────────────────────────────────────────────────

export type ReservationStatus = 'CONFIRMED' | 'CANCELLED';

export interface Reservation {
  id: number;
  status: ReservationStatus;
  totalPrice: number;
  createdAt: string;
  screening: {
    id: number;
    startTime: string;
    endTime: string;
    movie: { title: string };
    theater: { name: string };
  };
  reservationSeats: {
    seat: { row: string; col: number };
  }[];
}
