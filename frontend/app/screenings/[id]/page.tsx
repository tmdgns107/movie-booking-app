'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { getScreeningDetail, createReservation } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { ScreeningSkeleton } from '@/components/Skeleton';
import ConfirmDialog from '@/components/ConfirmDialog';
import type { ScreeningDetail, SeatWithStatus, Reservation } from '@/types';

export default function ScreeningPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const screeningId = Number(id);

  const [selected, setSelected] = useState<number[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 비로그인 안내 모달
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  // 예매 완료 모달
  const [completedReservation, setCompletedReservation] = useState<Reservation | null>(null);

  const { data: detail, isLoading } = useQuery<ScreeningDetail>({
    queryKey: ['screening', screeningId],
    queryFn: () => getScreeningDetail(screeningId),
  });

  function toggleSeat(seat: SeatWithStatus) {
    if (seat.reserved) return;
    setSelected((prev) =>
      prev.includes(seat.id)
        ? prev.filter((id) => id !== seat.id)
        : [...prev, seat.id],
    );
  }

  async function handleReserve() {
    if (!getToken()) {
      setShowLoginPrompt(true);
      return;
    }
    if (selected.length === 0) {
      setError('좌석을 선택해 주세요.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const reservation = await createReservation({ screeningId, seatIds: selected });
      await queryClient.invalidateQueries({ queryKey: ['screening', screeningId] });
      setSelected([]);
      setCompletedReservation(reservation);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '예매 실패');
    } finally {
      setLoading(false);
    }
  }

  if (isLoading) return <ScreeningSkeleton />;
  if (!detail) return <p className="text-red-500">상영 정보를 찾을 수 없습니다.</p>;

  const rows = Array.from(new Set(detail.seats.map((s) => s.row))).sort();
  const totalPrice = selected.length * detail.price;

  return (
    <div>
      {/* 비로그인 안내 다이얼로그 */}
      {showLoginPrompt && (
        <ConfirmDialog
          message="로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?"
          confirmLabel="로그인"
          cancelLabel="취소"
          onConfirm={() => router.push('/login')}
          onCancel={() => setShowLoginPrompt(false)}
        />
      )}

      {/* 예매 완료 모달 */}
      {completedReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-80 rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 text-center">
              <span className="text-3xl">🎉</span>
              <h2 className="mt-2 text-lg font-bold text-gray-900">예매 완료!</h2>
            </div>
            <div className="space-y-1.5 rounded bg-gray-50 p-3 text-sm text-gray-700">
              <p>
                <span className="text-gray-400">영화</span>{' '}
                <span className="font-medium">{detail.movie?.title}</span>
              </p>
              <p>
                <span className="text-gray-400">일시</span>{' '}
                <span className="font-medium">
                  {new Date(detail.startTime).toLocaleString('ko-KR', {
                    month: 'long',
                    day: 'numeric',
                    weekday: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </p>
              <p>
                <span className="text-gray-400">상영관</span>{' '}
                <span className="font-medium">{detail.theater?.name}</span>
              </p>
              <p>
                <span className="text-gray-400">좌석</span>{' '}
                <span className="font-medium">
                  {completedReservation.seats.map((s) => `${s.row}${s.col}`).join(', ')}
                </span>
              </p>
              <p>
                <span className="text-gray-400">결제금액</span>{' '}
                <span className="font-medium text-blue-600">
                  {completedReservation.totalPrice.toLocaleString()}원
                </span>
              </p>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setCompletedReservation(null)}
                className="flex-1 rounded border border-gray-300 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                계속 예매
              </button>
              <button
                onClick={() => router.push('/reservations')}
                className="flex-1 rounded bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                예매 내역 보기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상영 정보 요약 */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
        <h1 className="text-lg font-bold text-gray-900">{detail.movie?.title}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {new Date(detail.startTime).toLocaleString('ko-KR', {
            month: 'long',
            day: 'numeric',
            weekday: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}{' '}
          · {detail.theater?.name} · {detail.price.toLocaleString()}원/석
        </p>
      </div>

      {/* 좌석 선택 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-6 rounded bg-gray-100 py-2 text-center text-xs text-gray-400">
          SCREEN
        </div>

        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row} className="flex items-center gap-2">
              <span className="w-5 text-center text-xs text-gray-400">{row}</span>
              <div className="flex gap-1.5">
                {detail.seats
                  .filter((s) => s.row === row)
                  .sort((a, b) => a.col - b.col)
                  .map((seat) => {
                    const isSelected = selected.includes(seat.id);
                    return (
                      <button
                        key={seat.id}
                        disabled={seat.reserved}
                        onClick={() => toggleSeat(seat)}
                        title={`${seat.row}${seat.col}`}
                        className={[
                          'h-8 w-8 rounded text-xs font-medium transition',
                          seat.reserved
                            ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                            : isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-blue-100',
                        ].join(' ')}
                      >
                        {seat.col}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-4 w-4 rounded bg-gray-100" />
            선택 가능
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-4 w-4 rounded bg-blue-600" />
            선택됨
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-4 w-4 rounded bg-gray-200" />
            예매됨
          </span>
        </div>
      </div>

      {/* 예매 하단 바 */}
      <div className="mt-6 flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
        <div className="text-sm text-gray-700">
          선택된 좌석:{' '}
          <span className="font-medium">{selected.length}석</span>
          {selected.length > 0 && (
            <>
              {' '}·{' '}
              <span className="font-medium text-blue-600">
                {totalPrice.toLocaleString()}원
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            onClick={handleReserve}
            disabled={loading || selected.length === 0}
            className="rounded bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '예매 중...' : '예매하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
