// app/page.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Home() {

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      {/* Hero Section */}
      <section
        className="text-center rounded-lg py-20 bg-white w-full"
        style={{
            backgroundImage: "url('/images/background.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        }}
        >
        <section className="relative text-center rounded-lg py-20 bg-hero-pattern bg-cover bg-center w-full">
            <div className="absolute inset-0 bg-black opacity-50"></div>
            <div className="relative z-10">
                <h1 className="text-5xl font-bold mb-4 text-white">Welcome to Healcome KAIST</h1>
                <p className="text-xl text-gray-200 mb-8">
                당신의 운동을 더 스마트하게 관리하세요.
                </p>
            </div>
        </section>
      </section>


      {/* 기능 소개 섹션 */}
      <section className="py-20 w-full">
        <h2 className="text-3xl font-semibold text-center mb-12 text-black">
          주요 기능 소개
        </h2>
        <div className="flex flex-wrap justify-center gap-8 px-4">
          {/* Gym 기능 카드 */}
          <div className="bg-white rounded-lg shadow-md p-6 w-80">
            <div className="h-20 w-20 mx-auto mb-4 relative">
              <Image
                src="/images/gym-icon.png"
                alt="Gym"
                layout="fill"
                objectFit="contain"
              />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-black">Gym</h3>
            <p className="text-gray-700 mb-4">
              KAIST에 있는 헬스장 정보를 저장하고, 그 정보를 바탕으로 운동 계획을 세워보세요.
            </p>
            <Link href="/dashboard/gym">
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700">
                내 헬스장 추가하기
              </button>
            </Link>
          </div>

          {/* Routine 기능 카드 */}
          <div className="bg-white rounded-lg shadow-md p-6 w-80">
            <div className="h-20 w-20 mx-auto mb-4 relative">
              <Image
                src="/images/routine-icon.png"
                alt="Routine"
                layout="fill"
                objectFit="contain"
              />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-black">Routine</h3>
            <p className="text-gray-700 mb-4">
              헬스장과 운동 세트 수, 중량을 선택하여 나만의 운동 루틴을 만들고 사용해보세요.
            </p>
            <Link href="/dashboard/routine">
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700">
                내 운동루틴 추가하기
              </button>
            </Link>
          </div>

          {/* log 기능 카드 */}
          <div className="bg-white rounded-lg shadow-md p-6 w-80">
            <div className="h-20 w-20 mx-auto mb-4 relative">
              <Image
                src="/images/log-icon.png"
                alt="Routine"
                layout="fill"
                objectFit="contain"
              />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-black">Log</h3>
            <p className="text-gray-700 mb-4">
              지금까지 자신이 운동했던 기록들을 살펴보세요.
            </p>
            <Link href="/dashboard/log">
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700">
                내 운동루틴 추가하기
              </button>
            </Link>
          </div>

        </div>

        
      </section>
    </main>
  );
}
