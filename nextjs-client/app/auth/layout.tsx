'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import Image from 'next/image';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* 배경 이미지 */}
      <div className="absolute w-full h-full">
        <Image
          src="/images/background.jpg"
          alt="Background Image"
          layout="fill"
          objectFit="cover"
          quality={100}
          className="filter blur-lg brightness-70"
        />
      </div>

      {/* 로고 */}
      <h1 className="absolute top-4 left-4 text-xl font-semibold text-white">
        Healcome_KAIST
      </h1>

      {/* 중앙 영역 */}
      <div className="relative z10 flex items-center justify-center h-full">
        <div className="bg-white bg-opacity-70 rounded-lg p-7 w-80">
          {children}
        </div>
      </div>
    </div>
  );
}