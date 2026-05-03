'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getReservations, cancelReservation } from '@/lib/api';
import { getToken } from '@/lib/auth';
import type { Reservation } from '@/types';

export default function ReservationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!getToken()) router.push('/login');
  }, [router]);

  const {
    data: reservations,
    isLoading,
    isError,
  } = useQuery<Reservation[]>({
    queryKey: ['reservations'],
    queryFn: getReservations,
    enabled: !!getToken(),
  });

  const cancelMut = useMutation({
    mutationFn: (id: number) => cancelReservation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });

  if (isLoading)
    return <p className="text-gray-500">예매 내역을 불러오는 중...</p>;

  if (isError)
    return <p className="text-red-500">예매 내역을 불러오지 못했습니다.</p>;

  const active    = reservations?.filter((r) => r.status === 'CONFIRMED')  ?? [];
  const cancelled = reservations?.filter((r) => r.status === 'CANCELLED') ?? [];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">내 예매 내역</h1>

      {reservations?.length === 0 && (
        <p className="text-gray-500">예매 내역이 없습니다.</p>
      )}

      {active.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
            예매 확정
          </h2>
          <div className="space-y-3">
            {active.map((r) => (
              <ReservationCard
                key={r.id}
                reservation={r}
                onCancel={() => cancelMut.mutate(r.id)}
                cancelling={cancelMut.isPending && cancelMut.variables === r.id}
              />
            ))}
          </div>
        </section>
      )}

      {cancelled.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
            취소된 예매
          </h2>
          <div className="space-y-3 opacity-60">
            {cancelled.map((r) => (
              <ReservationCard key={r.id} reservation={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ReservationCard({
  reservation: r,
  onCancel,
  cancelling,
}: {
  reservation: Reservation;
  onCancel?: () => void;
  cancelling?: boolean;
}) {
  const seats = r.seats.map((s) => `${s.row}${s.col}`).join(', ');

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-gray-900">{r.movieTitle}</p>
          <p className="mt-0.5 text-sm text-gray-500">
            {new Date(r.startTime).toLocaleString('ko-KR', {
              month: 'long',
              day: 'numeric',
              weekday: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            · {r.theaterName}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            좌석: <span className="font-medium">{seats}</span>
          </p>
          <p className="mt-0.5 text-sm font-medium text-blue-600">
            {r.totalPrice.toLocaleString()}원
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span
            className={[
              'rounded px-2 py-0.5 text-xs font-medium',
              r.status === 'CONFIRMED'
                ? 'bg-green-50 text-green-700'
                : 'bg-gray-100 text-gray-500',
            ].join(' ')}
          >
            {r.status === 'CONFIRMED' ? '예매 확정' : '취소됨'}
          </span>

          {onCancel && r.status === 'CONFIRMED' && (
            <button
              onClick={onCancel}
              disabled={cancelling}
              className="text-xs text-red-500 hover:underline disabled:opacity-50"
            >
              {cancelling ? '취소 중...' : '예매 취소'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
