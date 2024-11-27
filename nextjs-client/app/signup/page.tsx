// pages/signup.tsx
import Link from "next/link";

export default function Signup() {
  return (
    <div className="grid items-center justify-items-center min-h-screen p-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 items-center">
        {/* Logo */}
        <Link href="/">
          <a>
            <h1 className="text-4xl font-bold">Healcome_KAIST</h1>
          </a>
        </Link>

        {/* Signup Form */}
        <form className="flex flex-col gap-4 w-full max-w-sm">
          <input
            type="email"
            placeholder="Email"
            className="border border-gray-300 rounded-lg px-4 py-2"
          />
          <input
            type="password"
            placeholder="Password"
            className="border border-gray-300 rounded-lg px-4 py-2"
          />
          <button
            type="submit"
            className="rounded-lg bg-green-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-green-400"
          >
            Signup
          </button>
        </form>

        {/* Link to Login */}
        <p className="text-sm">
          Already have an account?{" "}
          <Link href="/login">
            <a className="text-blue-500 hover:underline">Log in</a>
          </Link>
        </p>
      </main>
    </div>
  );
}
