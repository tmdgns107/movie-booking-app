'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { checkEmail, signup } from '@/lib/api';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [emailStatus, setEmailStatus] = useState<'idle' | 'ok' | 'taken'>(
    'idle',
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleEmailBlur() {
    if (!form.email) return;
    try {
      const { available } = await checkEmail(form.email);
      setEmailStatus(available ? 'ok' : 'taken');
    } catch {
      setEmailStatus('idle');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (emailStatus === 'taken') return;
    setError('');
    setLoading(true);
    try {
      await signup(form);
      router.push('/login');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '회원가입 실패');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">회원가입</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            이름
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            이메일
          </label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => {
              setForm({ ...form, email: e.target.value });
              setEmailStatus('idle');
            }}
            onBlur={handleEmailBlur}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          {emailStatus === 'ok' && (
            <p className="mt-1 text-xs text-green-600">사용 가능한 이메일입니다.</p>
          )}
          {emailStatus === 'taken' && (
            <p className="mt-1 text-xs text-red-500">이미 사용 중인 이메일입니다.</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            비밀번호
          </label>
          <input
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          <p className="mt-1 text-xs text-gray-400">
            8자 이상, 영문·숫자·특수문자 포함, 연속된 숫자 3개 이상 불가
          </p>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading || emailStatus === 'taken'}
          className="w-full rounded bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '가입 중...' : '회원가입'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-500">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="text-blue-600 hover:underline">
          로그인
        </Link>
      </p>
    </div>
  );
}
