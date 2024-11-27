// pages/login.tsx
import Link from "next/link";

export default function Login() {
  return (
    <div className="grid items-center justify-items-center min-h-screen p-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 items-center">
        {/* Logo */}
        <Link href="/">
          <a>
            <h1 className="text-4xl font-bold">Healcome_KAIST</h1>
          </a>
        </Link>

        {/* Login Form */}
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
            className="rounded-lg bg-blue-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-400"
          >
            Login
          </button>
        </form>

        {/* Link to Signup */}
        <p className="text-sm">
          Don't have an account?{" "}
          <Link href="/signup">
            <a className="text-blue-500 hover:underline">Sign up</a>
          </Link>
        </p>
      </main>
    </div>
  );
}
