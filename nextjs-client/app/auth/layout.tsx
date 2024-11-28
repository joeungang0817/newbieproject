'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* 배경 이미지 */}
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-lg brightness-75"
        style={{ backgroundImage: "url('/images/background.jpg')" }}
      ></div>

      {/* 로고 */}
      <Link href="/">
        <h1 className="absolute top-4 left-4 text-xl font-semibold text-white cursor-pointer">
          Healcome_KAIST
        </h1>
      </Link>

      {/* 중앙 영역 */}
      <div className="relative z10 flex items-center justify-center h-full">
        <div className="bg-white bg-opacity-70 rounded-lg p-7 w-80">
          {children}
        </div>
      </div>
    </div>
  );
}