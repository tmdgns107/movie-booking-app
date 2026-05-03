'use client';

import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { getMovies } from '@/lib/api';
import { MovieCardSkeleton } from '@/components/Skeleton';
import type { Movie } from '@/types';

export default function HomePage() {
  const { data: movies, isLoading, isError } = useQuery<Movie[]>({
    queryKey: ['movies'],
    queryFn: getMovies,
  });

  if (isLoading)
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-gray-900">상영 중인 영화</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => <MovieCardSkeleton key={i} />)}
        </div>
      </div>
    );

  if (isError)
    return <p className="text-red-500">영화 목록을 불러오지 못했습니다.</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">상영 중인 영화</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {movies?.map((movie) => (
          <Link
            key={movie.id}
            href={`/movies/${movie.id}`}
            className="flex gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:border-blue-400 hover:shadow-md transition"
          >
            {/* 포스터 */}
            <div className="relative h-36 w-24 shrink-0 overflow-hidden rounded bg-gray-100">
              {movie.posterUrl ? (
                <Image
                  src={movie.posterUrl}
                  alt={`${movie.title} 포스터`}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center p-2 text-center text-xs text-gray-400">
                  {movie.title}
                </div>
              )}
            </div>

            {/* 정보 */}
            <div className="flex flex-col justify-between py-0.5">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-gray-900">
                    {movie.title}
                  </h2>
                  <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700">
                    {movie.rating}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  {new Date(movie.releaseDate).toLocaleDateString('ko-KR')} 개봉 · {movie.runningTime}분
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                  {movie.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
