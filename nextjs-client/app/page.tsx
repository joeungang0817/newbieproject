// app/page.tsx
import Link from "next/link";
import Image from "next/image";

export default function Home() {
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

      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center">
        {/* 로고 */}
        <h1 className="text-6xl font-bold text-white mb-32 animate-fadeInDown">
          Healcome_KAIST
        </h1>

        {/* Start 버튼 */}
        <Link href="/auth">
          <button className="px-10 py-2 text-2xl font-semibold text-white bg-gradient-to-r from-blue-800 to-blue-600 rounded-full shadow-lg transition-transform duration-300 transform hover:-translate-y-1 animate-fadeInDown">
            Start
          </button>
        </Link>
      </div>
    </div>
  );
}

