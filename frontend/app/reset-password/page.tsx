'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { resetPassword } from '@/lib/api';
import { validatePassword, isPasswordValid } from '@/lib/validatePassword';
import PasswordInput from '@/components/PasswordInput';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: '',
    newPassword: '',
    newPasswordConfirm: '',
  });
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordRules = validatePassword(form.newPassword);
  const passwordValid = isPasswordValid(form.newPassword);
  const passwordMismatch =
    form.newPasswordConfirm.length > 0 &&
    form.newPassword !== form.newPasswordConfirm;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordTouched(true);
    if (!passwordValid || passwordMismatch) return;

    setError('');
    setLoading(true);
    try {
      await resetPassword({ email: form.email, newPassword: form.newPassword });
      alert('비밀번호가 재설정되었습니다. 새 비밀번호로 로그인해 주세요.');
      router.push('/login');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '비밀번호 재설정 실패');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">비밀번호 재설정</h1>
      <p className="mb-6 text-sm text-gray-500">
        가입한 이메일과 새로운 비밀번호를 입력해 주세요.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">이메일</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            새 비밀번호
          </label>
          <div className="mt-1">
            <PasswordInput
              value={form.newPassword}
              onChange={(v) => {
                setForm({ ...form, newPassword: v });
                setPasswordTouched(true);
              }}
              required
            />
          </div>
          {passwordTouched && (
            <ul className="mt-1.5 space-y-0.5">
              {passwordRules.map((rule) => (
                <li
                  key={rule.message}
                  className={[
                    'flex items-center gap-1 text-xs',
                    rule.valid ? 'text-green-600' : 'text-red-500',
                  ].join(' ')}
                >
                  <span>{rule.valid ? '✓' : '✗'}</span>
                  {rule.message}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            새 비밀번호 확인
          </label>
          <div className="mt-1">
            <PasswordInput
              value={form.newPasswordConfirm}
              onChange={(v) => setForm({ ...form, newPasswordConfirm: v })}
              required
              className={passwordMismatch ? 'border-red-400 focus:border-red-400' : ''}
            />
          </div>
          {passwordMismatch && (
            <p className="mt-1 text-xs text-red-500">비밀번호가 일치하지 않습니다.</p>
          )}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading || passwordMismatch}
          className="w-full rounded bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '재설정 중...' : '비밀번호 재설정'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-500">
        <Link href="/login" className="text-blue-600 hover:underline">
          로그인으로 돌아가기
        </Link>
      </p>
    </div>
  );
}
