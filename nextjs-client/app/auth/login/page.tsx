// app/login/page.tsx
'use client';

import React,{ useState } from 'react';
import axios from "axios";
import { useRouter } from 'next/navigation';
import { SAPIBase } from "@/app/lib/api";
import Link from 'next/link';

axios.defaults.withCredentials = true; 
export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const Login = async () => {
    try {
      // 회원가입 요청
      const response = await axios.post(`${SAPIBase}/auth/login`, {
        email: email,
        password: password,
      });
      alert('로그인이 완료되었습니다. 홈으로 이동합니다.');
      
      router.push('/dashboard');
    } catch (error: any) {
      alert(error.response?.data?.error || '로그인에 실패하였습니다.');
    }
  };

  return (
    <main>
      <h2 className="text-3xl font-bold text-center mb-6 text-black">Login</h2>
      <form onSubmit={(e) => {
              e.preventDefault();
              Login();
            }} className="flex items-start gap-4">
        <div className="flex flex-col gap-4 w-64">
          <input
            type="email"
            placeholder="Email"
            className="border border-gray-300 rounded-lg px-4 py-2 w-full text-black"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="border border-gray-300 rounded-lg px-4 py-2 w-full text-black"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="w-32 h-24 rounded-lg bg-blue-500 px-6 py-3 text-white font-medium transition-transform duration-300 transform hover:-translate-y-1"
        >
          Login
        </button>
      </form>
      <p className="text-center mt-4">
        계정이 없으신가요?{' '}
        <Link href="/auth/signup">
          <span className="text-blue-500 hover:underline cursor-pointer">
            회원가입
          </span>
        </Link>
      </p>
    </main>
  );
}
