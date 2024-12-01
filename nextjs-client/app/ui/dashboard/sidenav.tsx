'use client';

import Link from 'next/link';
import NavLinks from '@/app/ui/dashboard/nav-links';
import axiosInstance from '@/app/utils/axiosInstance';
import { FaUserCircle } from 'react-icons/fa';
import React, { useState, useEffect } from 'react';
import axios from "axios";
import { SAPIBase } from "@/app/lib/api";
import { useRouter } from 'next/navigation';

axios.defaults.withCredentials = true; 
export default function SideNav() {
  const [userName, setUserName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const response = await axiosInstance.get(`${SAPIBase}/user/info`); // baseURL이 이미 설정되어 있으므로 경로만 작성
        const { data } = response;
        setUserName(data.user.name);
      } catch (err: any) {
        setError(err.response?.data?.error || '사용자 정보를 가져오는 데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserName();
  }, []); 

  const handleSignOut = async () => {
    try {
      const response = await axios.post(`${SAPIBase}/auth/logout`);

      if (response) {
        // 로그아웃 성공 시 로그인 페이지로 이동
        alert("로그아웃 되었습니다.");
        router.push('/');
      } else {
        throw new Error('로그아웃에 실패했습니다.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };


  return (
    <div className="flex h-full flex-col justify-between px-2 py-3 md:px-1 bg-gray-100">
      {/* 상단 섹션 */}
      <div>
        {/* 사용자 아이콘 및 이름 */}
        <div className="flex items-center justify-center mb-3 space-x-2">
          <Link href="/userpage">
            <FaUserCircle className="text-3xl text-gray-800 hover:text-blue-600 cursor-pointer" />
          </Link>
          {/* 사용자 이름 표시 */}
          {isLoading ? (
            <span className="text-gray-700 text-sm">Loading...</span>
          ) : error ? (
            <span className="text-red-500 text-sm">{error}</span>
          ) : (
            <span className="text-gray-800 text-sm">{userName}</span>
          )}
        </div>

        {/* 네비게이션 링크 */}
        <div className="flex flex-col space-y-1">
          <NavLinks />
        </div>
      </div>

      {/* Sign Out 버튼 */}
      <button
        onClick={handleSignOut}
        aria-label="Sign Out"
        className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-gray-200 p-2 text-sm font-medium text-gray-800 hover:bg-sky-100 hover:text-blue-600"
      >
        Sign Out
      </button>
    </div>
  );
}
