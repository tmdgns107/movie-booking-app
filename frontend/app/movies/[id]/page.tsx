'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { getMovie, getScreenings } from '@/lib/api';
import type { Movie, Screening } from '@/types';

function groupByDate(screenings: Screening[]) {
  const map = new Map<string, Screening[]>();
  for (const s of screenings) {
    const date = new Date(s.startTime).toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
    if (!map.has(date)) map.set(date, []);
    map.get(date)!.push(s);
  }
  return map;
}

export default function MoviePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const movieId = Number(id);

  const { data: movie, isLoading: movieLoading } = useQuery<Movie>({
    queryKey: ['movie', movieId],
    queryFn: () => getMovie(movieId),
  });

  const { data: screenings, isLoading: screeningsLoading } = useQuery<Screening[]>({
    queryKey: ['screenings', movieId],
    queryFn: () => getScreenings(movieId),
  });

  if (movieLoading || screeningsLoading)
    return <p className="text-gray-500">불러오는 중...</p>;

  if (!movie) return <p className="text-red-500">영화를 찾을 수 없습니다.</p>;

  const grouped = groupByDate(screenings ?? []);

  return (
    <div>
      {/* 영화 정보 */}
      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex gap-6">
          {/* 포스터 */}
          <div className="relative h-56 w-36 shrink-0 overflow-hidden rounded bg-gray-100">
            {movie.posterUrl ? (
              <Image
                src={movie.posterUrl}
                alt={`${movie.title} 포스터`}
                fill
                sizes="144px"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center p-3 text-center text-sm text-gray-400">
                {movie.title}
              </div>
            )}
          </div>

          {/* 텍스트 정보 */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{movie.title}</h1>
                <span className="rounded bg-blue-50 px-2 py-1 text-sm font-medium text-blue-700">
                  {movie.rating}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {new Date(movie.releaseDate).toLocaleDateString('ko-KR')} 개봉 · {movie.runningTime}분
              </p>
              <p className="mt-4 text-sm leading-relaxed text-gray-700">
                {movie.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 상영 일정 */}
      <h2 className="mb-4 text-lg font-semibold text-gray-900">상영 일정</h2>

      {grouped.size === 0 ? (
        <p className="text-gray-500">예정된 상영이 없습니다.</p>
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([date, list]) => (
            <div key={date}>
              <p className="mb-2 text-sm font-medium text-gray-500">{date}</p>
              <div className="flex flex-wrap gap-2">
                {list.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => router.push(`/screenings/${s.id}`)}
                    className="rounded border border-gray-200 bg-white px-4 py-3 text-left text-sm hover:border-blue-400 hover:bg-blue-50 transition"
                  >
                    <div className="font-medium text-gray-900">
                      {new Date(s.startTime).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <div className="mt-0.5 text-xs text-gray-500">
                      {s.theater?.name}
                    </div>
                    <div className="mt-0.5 text-xs text-blue-600">
                      {s.price.toLocaleString()}원
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
