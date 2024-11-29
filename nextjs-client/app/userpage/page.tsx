// app/userpage/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import axiosInstance from '@/app/utils/axiosInstance';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { SAPIBase } from '../lib/api';

const tierImages: { [key: number]: string } = {
  1: '/images/tier1.png',
  2: '/images/tier2.png',
  3: '/images/tier3.png',
  4: '/images/tier4.png',
  5: '/images/tier5.png',
};

const UserPage = () => {
  const router = useRouter();
  const [user, setUser] = useState<{
    name: string;
    squat: number;
    bench: number;
    dead: number;
    tier: string;
  }>({
    name: 'user',
    squat: 0,
    bench: 0,
    dead: 0,
    tier: 'Beginner',
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 편집 상태 관리
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [isEditingStrength, setIsEditingStrength] = useState<boolean>(false);

  // 입력 값 관리
  const [editName, setEditName] = useState<string>('');
  const [editSquat, setEditSquat] = useState<number>(0);
  const [editBench, setEditBench] = useState<number>(0);
  const [editDead, setEditDead] = useState<number>(0);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await axiosInstance.get(`${SAPIBase}/user/info`); // 백엔드 API에 따라 경로 조정
        const { data } = response;
        setUser({
          name: data.user.name,
          squat: data.user.squat,
          bench: data.user.bench,
          dead: data.user.dead,
          tier: data.user.tier,
        });
        setEditName(data.user.name);
        setEditSquat(data.user.squat);
        setEditBench(data.user.bench);
        setEditDead(data.user.dead);
      } catch (err: any) {
        setError(err.response?.data?.error || '사용자 정보를 가져오는 데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  const handleNameEditToggle = () => {
    setIsEditingName(!isEditingName);
    setEditName(user.name); // 현재 이름으로 초기화
  };

  const handleStrengthEditToggle = () => {
    setIsEditingStrength(!isEditingStrength);
    setEditSquat(user.squat);
    setEditBench(user.bench);
    setEditDead(user.dead);
  };

  const handleNameSave = async () => {
    try {
      const response = await axiosInstance.patch(`${SAPIBase}/user/update`, { name: editName });
      const { data } = response;
      setUser((prev) => ({
        ...prev,
        name: data.user.name,
        tier: data.user.tier,
      }));
      setIsEditingName(false);
      alert('이름이 성공적으로 변경되었습니다.');
    } catch (err: any) {
      alert(err.response?.data?.error || '이름 변경에 실패했습니다.');
    }
  };

  const handleStrengthSave = async () => {
    try {
      const response = await axiosInstance.patch(`${SAPIBase}/user/update`, {
        squat: editSquat,
        bench: editBench,
        dead: editDead,
      });
      const { data } = response;
      setUser((prev) => ({
        ...prev,
        squat: data.user.squat,
        bench: data.user.bench,
        dead: data.user.dead,
        tier: data.user.tier,
      }));
      setIsEditingStrength(false);
      alert('3대 운동이 성공적으로 변경되었습니다.');
    } catch (err: any) {
      alert(err.response?.data?.error || '3대 운동 변경에 실패했습니다.');
    }
  };

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  if (isLoading) {
    return <p>로딩 중...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">사용자 정보</h1>

      {/* 이름 섹션 */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold">이름</h2>
        {isEditingName ? (
          <div className="flex items-center mt-2">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="border p-2 mr-2 flex-1"
            />
            <button
              onClick={handleNameSave}
              className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
            >
              저장
            </button>
            <button
              onClick={handleNameEditToggle}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded"
            >
              취소
            </button>
          </div>
        ) : (
          <div className="flex items-center mt-2">
            <span className="mr-4">{user.name}</span>
            <button
              onClick={handleNameEditToggle}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              변경
            </button>
          </div>
        )}
      </div>

      {/* 3대 운동 섹션 */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold">3대 운동</h2>
        {isEditingStrength ? (
          <div className="mt-2">
            <div className="flex items-center mb-2">
              <label className="w-20">스쿼트:</label>
              <input
                type="number"
                value={editSquat}
                onChange={(e) => setEditSquat(parseInt(e.target.value))}
                className="border p-2 flex-1"
              />
            </div>
            <div className="flex items-center mb-2">
              <label className="w-20">벤치:</label>
              <input
                type="number"
                value={editBench}
                onChange={(e) => setEditBench(parseInt(e.target.value))}
                className="border p-2 flex-1"
              />
            </div>
            <div className="flex items-center mb-4">
              <label className="w-20">데드:</label>
              <input
                type="number"
                value={editDead}
                onChange={(e) => setEditDead(parseInt(e.target.value))}
                className="border p-2 flex-1"
              />
            </div>
            <div className="flex items-center">
              <button
                onClick={handleStrengthSave}
                className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
              >
                저장
              </button>
              <button
                onClick={handleStrengthEditToggle}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-2">
            <p>
              스쿼트: <strong>{user.squat}</strong> kg
            </p>
            <p>
              벤치: <strong>{user.bench}</strong> kg
            </p>
            <p>
              데드: <strong>{user.dead}</strong> kg
            </p>
            <button
              onClick={handleStrengthEditToggle}
              className="mt-2 bg-green-500 text-white px-4 py-2 rounded"
            >
              변경
            </button>
          </div>
        )}
      </div>

      {/* Tier 섹션 */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Tier</h2>
        <div className="flex items-center mt-2">
          <span className="mr-4">Tier {user.tier}</span>
          {tierImages[user.tier] && (
            <Image
              src={tierImages[user.tier]}
              alt={`Tier ${user.tier}`}
              width={50}
              height={50}
            />
          )}
        </div>
      </div>

      {/* 대시보드로 돌아가기 버튼 */}
      <button
        onClick={handleBackToDashboard}
        className="bg-purple-500 text-white px-4 py-2 rounded"
      >
        대시보드로 돌아가기
      </button>
    </div>
  );
};

export default UserPage;
