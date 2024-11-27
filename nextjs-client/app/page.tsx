// pages/index.tsx
import Link from "next/link";

export default function Home() {
  return (
    <div className="grid items-center justify-items-center min-h-screen p-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 items-center">
        {/* Logo */}
        <h1 className="text-4xl font-bold">Healcome_KAIST</h1>

        {/* Buttons */}
        <div className="flex gap-4">
          <Link href="/login">
            <a className="rounded-lg bg-blue-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-400">
              Login
            </a>
          </Link>
          <Link href="/signup">
            <a className="rounded-lg bg-green-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-green-400">
              Signup
            </a>
          </Link>
        </div>
      </main>
    </div>
  );
}
