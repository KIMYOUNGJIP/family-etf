import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '가족 ETF 통합 관리 대시보드 | 실시간 시세 & 손익 추적',
  description: '본인(김영집), 둘째(김하율), 첫째(김은비) 가족 증권계좌 ETF 실시간 시세 변동 추적 및 장 마감 텔레그램 알림 웹앱',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
