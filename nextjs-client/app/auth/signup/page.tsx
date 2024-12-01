'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { SAPIBase } from '@/app/lib/api';
import Link from 'next/link';

export default function SignUp() {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const Register = async () => {
    try {
      const response = await axios.post(`${SAPIBase}/auth/signup`, {
        email,
        password,
      });
      alert('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.');
      router.push('/auth/login');
    } catch (error: any) {
      alert(error.response?.data?.error || '회원가입에 실패하였습니다.');
    }
  };

  return (
    <main>
      <h2 className="text-3xl font-bold text-center mb-6 text-black">Sign up</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          Register();
        }}
        className="flex items-start gap-4"
      >
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
            minLength={6}
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
          Sign up
        </button>
      </form>
      <p className="text-center mt-4">
        계정이 있으신가요?{' '}
        <Link href="/auth/login">
          <span className="text-blue-500 hover:underline cursor-pointer">로그인</span>
        </Link>
      </p>
    </main>
  );
}
