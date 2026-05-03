import type { Metadata } from 'next';
import './globals.css';
import QueryProvider from '@/components/QueryProvider';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'MovieBook',
  description: '영화 티켓 예매 서비스',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <QueryProvider>
          <Header />
          <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
        </QueryProvider>
      </body>
    </html>
  );
}
