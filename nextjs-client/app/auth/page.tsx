// app/auth/page.tsx
'use client';

import Link from 'next/link';

export default function AuthPage() {
  return (
    <main>
    {/* 버튼 그룹 */}
    <div className="flex flex-col items-center gap-4">
        <Link href="/auth/login">
            <button className="w-64 bg-blue-600 text-white font-medium py-4 rounded-lg hover:bg-blue-800 transition-colors">
            Login
            </button>
        </Link>
        <Link href="/auth/signup">
            <button className="w-64 bg-blue-600 text-white font-medium py-4 rounded-lg hover:bg-blue-800 transition-colors">
            Sign Up
            </button>
        </Link>
    </div>
    </main>
  );
}
