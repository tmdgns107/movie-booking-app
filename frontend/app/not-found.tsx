import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-6xl font-bold text-gray-200">404</p>
      <h1 className="mt-4 text-xl font-semibold text-gray-800">
        페이지를 찾을 수 없습니다
      </h1>
      <p className="mt-2 text-sm text-gray-500">
        주소가 잘못되었거나 삭제된 페이지입니다.
      </p>
      <Link
        href="/"
        className="mt-6 rounded bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
