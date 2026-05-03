'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getToken, removeToken } from '@/lib/auth';
import { getMe } from '@/lib/api';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState<string | null>(null);

  // pathname을 의존성으로 추가 — 페이지 이동 시마다 토큰 상태 재확인.
  // Next.js App Router는 레이아웃을 재마운트하지 않으므로 빈 배열로는
  // 로그인 직후 상태 변경을 감지하지 못함.
  useEffect(() => {
    if (!getToken()) {
      setUserName(null);
      return;
    }
    getMe()
      .then((me) => setUserName(me.name))
      .catch(() => {
        removeToken();
        setUserName(null);
      });
  }, [pathname]);

  function logout() {
    removeToken();
    setUserName(null);
    router.push('/login');
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold text-blue-600">
          🎬 MovieBook
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          {userName ? (
            <>
              <Link
                href="/reservations"
                className="text-gray-600 hover:text-blue-600"
              >
                내 예매
              </Link>
              <span className="text-gray-400">|</span>
              <span className="text-gray-700">{userName}</span>
              <button
                onClick={logout}
                className="text-gray-500 hover:text-red-500"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-600 hover:text-blue-600">
                로그인
              </Link>
              <Link
                href="/signup"
                className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
              >
                회원가입
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
