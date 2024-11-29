// app/userpage/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import axiosInstance from '@/app/utils/axiosInstance';
import { FaUserCircle } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { SAPIBase } from '../lib/api';

const tierImages: { [key: string]: string } = {
  Beginner: '/images/tier1.png',
  Intermediate: '/images/tier2.png',
  Advanced: '/images/tier3.png',
  Expert: '/images/tier4.png',
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
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-200">
        <p className="text-xl text-black">로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-200">
        <p className="text-xl text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-black">사용자 정보</h1>

        {/* 이름 섹션 */}
        <div className="bg-gray-100 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <FaUserCircle className="text-4xl text-gray-700 mr-4" />
            {isEditingName ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="border p-2 rounded w-full text-black bg-gray-100 focus:outline-none"
                style={{ fontSize: '1.25rem' }} // 텍스트 크기 일관성 유지
              />
            ) : (
              <h2 className="text-2xl font-semibold text-black">{user.name}</h2>
            )}
          </div>
          <div>
            {isEditingName ? (
              <>
                <button
                  onClick={handleNameSave}
                  className="bg-blue-500 text-white px-4 py-2 rounded mr-2 hover:bg-blue-600 transition-colors duration-200"
                >
                  저장
                </button>
                <button
                  onClick={handleNameEditToggle}
                  className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400 transition-colors duration-200"
                >
                  취소
                </button>
              </>
            ) : (
              <button
                onClick={handleNameEditToggle}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors duration-200"
              >
                변경
              </button>
            )}
          </div>
        </div>

        {/* 3대 운동 섹션 */}
        <div className="bg-gray-100 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-black">3대 운동</h2>
            {isEditingStrength ? (
              <div>
                <button
                  onClick={handleStrengthSave}
                  className="bg-blue-500 text-white px-4 py-2 rounded mr-2 hover:bg-blue-600 transition-colors duration-200"
                >
                  저장
                </button>
                <button
                  onClick={handleStrengthEditToggle}
                  className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400 transition-colors duration-200"
                >
                  취소
                </button>
              </div>
            ) : (
              <button
                onClick={handleStrengthEditToggle}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors duration-200"
              >
                변경
              </button>
            )}
          </div>
          {isEditingStrength ? (
            <div className="space-y-4">
              <div className="flex items-center">
                <label className="w-24 text-black">스쿼트:</label>
                <input
                  type="number"
                  value={editSquat}
                  onChange={(e) => setEditSquat(parseInt(e.target.value) || 0)}
                  className="border p-2 rounded w-full text-black bg-gray-100 focus:outline-none"
                  style={{ fontSize: '1.25rem' }} // 텍스트 크기 일관성 유지
                />
              </div>
              <div className="flex items-center">
                <label className="w-24 text-black">벤치프레스:</label>
                <input
                  type="number"
                  value={editBench}
                  onChange={(e) => setEditBench(parseInt(e.target.value) || 0)}
                  className="border p-2 rounded w-full text-black bg-gray-100 focus:outline-none"
                  style={{ fontSize: '1.25rem' }} // 텍스트 크기 일관성 유지
                />
              </div>
              <div className="flex items-center">
                <label className="w-24 text-black">데드리프트:</label>
                <input
                  type="number"
                  value={editDead}
                  onChange={(e) => setEditDead(parseInt(e.target.value) || 0)}
                  className="border p-2 rounded w-full text-black bg-gray-100 focus:outline-none"
                  style={{ fontSize: '1.25rem' }} // 텍스트 크기 일관성 유지
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-black">
                스쿼트: <span className="font-semibold text-black">{user.squat} kg</span>
              </p>
              <p className="text-black">
                벤치프레스: <span className="font-semibold text-black">{user.bench} kg</span>
              </p>
              <p className="text-black">
                데드리프트: <span className="font-semibold text-black">{user.dead} kg</span>
              </p>
            </div>
          )}
        </div>

        {/* Tier 섹션 */}
        <div className="bg-gray-100 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-black mb-2">Tier</h2>
            <p className="text-3xl font-semibold text-black">{user.tier}</p>
          </div>
          {tierImages[user.tier] && (
            <Image
              src={tierImages[user.tier]}
              alt={`Tier ${user.tier}`}
              width={100}
              height={100}
              className="object-contain"
            />
          )}
        </div>

        {/* 대시보드로 돌아가기 버튼 */}
        <div className="flex justify-center">
          <button
            onClick={handleBackToDashboard}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors duration-200"
          >
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserPage;
