'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { getMovies } from '@/lib/api';
import type { Movie } from '@/types';

export default function HomePage() {
  const { data: movies, isLoading, isError } = useQuery<Movie[]>({
    queryKey: ['movies'],
    queryFn: getMovies,
  });

  if (isLoading)
    return <p className="text-gray-500">영화 목록을 불러오는 중...</p>;

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
            className="block rounded-lg border border-gray-200 bg-white p-5 shadow-sm hover:border-blue-400 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {movie.title}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {new Date(movie.releaseDate).toLocaleDateString('ko-KR')} 개봉
                </p>
              </div>
              <span className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                {movie.rating}
              </span>
            </div>

            <div className="mt-3 flex gap-4 text-sm text-gray-500">
              <span>{movie.rating}</span>
              <span>{movie.runningTime}분</span>
            </div>

            <p className="mt-3 line-clamp-2 text-sm text-gray-600">
              {movie.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
