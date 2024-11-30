'use client';

import { useState, useEffect } from 'react';
import axiosInstance from '@/app/utils/axiosInstance';
import { SAPIBase } from '@/app/lib/api';
import Modal from 'react-modal';
import Image from 'next/image';

interface Gym {
  id: number;
  name: string;
  equipment: string[];
  notes: string;
}

export default function GymsPage() {
  useEffect(() => {
    const rootElement = document.querySelector('#__next') as HTMLElement;
    Modal.setAppElement(rootElement);
  }, []);

  const [gyms, setGyms] = useState<Gym[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
  const [editGym, setEditGym] = useState<Gym | null>(null);
  const [newGym, setNewGym] = useState({ name: '', equipment: [''], notes: '' });

  const limit = 10;

  const fetchGyms = async (page: number) => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(`${SAPIBase}/gyms`, {
        params: { page, limit },
      });
      setGyms(response.data.data);
      setCurrentPage(response.data.currentPage);
      setTotalPages(response.data.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.error || '헬스장 목록을 가져오는 데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGyms(currentPage);
  }, [currentPage]);

  const openGymModal = (gym: Gym) => {
    setSelectedGym(gym);
    setEditGym({ ...gym });
    setIsModalOpen(true);
  };

  const closeGymModal = () => {
    setIsModalOpen(false);
    setSelectedGym(null);
    setEditGym(null);
  };

  const openAddGymModal = () => {
    setIsAddModalOpen(true);
  };

  const closeAddGymModal = () => {
    setIsAddModalOpen(false);
    setNewGym({ name: '', equipment: [''], notes: '' });
  };

  const handleAddEquipmentField = () => {
    setNewGym((prev) => ({
      ...prev,
      equipment: [...prev.equipment, ''],
    }));
  };

  const handleNewEquipmentChange = (index: number, value: string) => {
    setNewGym((prev) => {
      const updatedEquipment = [...prev.equipment];
      updatedEquipment[index] = value;
      return { ...prev, equipment: updatedEquipment };
    });
  };

  // 헬스장 추가 시 유효성 검사
const handleAddGym = async () => {
    // 이름과 최소 1개의 운동기구가 필요함
    if (!newGym.name.trim()) {
      alert('헬스장 이름을 입력해주세요.');
      return;
    }
    if (newGym.equipment.length === 0 || newGym.equipment.some((item) => item.trim() === '')) {
      alert('헬스장을 추가하기 위해선 운동기구를 하나 이상, 각 항목마다 공란이 없도록 입력해주세요.');
      return;
    }
  
    try {
      await axiosInstance.post(`${SAPIBase}/gyms`, {
        name: newGym.name,
        equipment: newGym.equipment.map((item) => item.replace(/\s+/g, '')), // 띄어쓰기 제거
        notes: newGym.notes,
      });
      closeAddGymModal();
      window.location.reload();
    } catch (err: any) {
      alert(err.response?.data?.error || '헬스장을 추가하는 데 실패했습니다.');
    }
  };
  
  // 헬스장 수정 시 유효성 검사
  const handleUpdateGym = async () => {
    if (!editGym || !editGym.name.trim()) {
      alert('헬스장 이름을 입력해주세요.');
      return;
    }
    if (
      editGym.equipment.length === 0 ||
      editGym.equipment.some((item) => item.trim() === '')
    ) {
      alert('헬스장을 추가하기 위해선 운동기구를 하나 이상, 각 항목마다 공란이 없도록 입력해주세요.');
      return;
    }
  
    try {
      await axiosInstance.patch(`${SAPIBase}/gyms/${editGym.id}`, {
        name: editGym.name,
        equipment: editGym.equipment.map((item) => item.replace(/\s+/g, '')), // 띄어쓰기 제거
        notes: editGym.notes,
      });
      alert('헬스장이 성공적으로 수정되었습니다.');
      closeGymModal();
      window.location.reload();
    } catch (err: any) {
      alert(err.response?.data?.error || '헬스장을 수정하는 데 실패했습니다.');
    }
  };

  const handleDeleteGym = async () => {
    if (!selectedGym) return;

    if (confirm('정말로 이 헬스장을 삭제하시겠습니까?')) {
      try {
        await axiosInstance.delete(`${SAPIBase}/gyms/${selectedGym.id}`);
        alert('헬스장이 성공적으로 삭제되었습니다.');
        closeGymModal();
        window.location.reload();
      } catch (err: any) {
        alert(err.response?.data?.error || '헬스장을 삭제하는 데 실패했습니다.');
      }
    }
  };

  const handleDeleteAllGyms = async () => {
    if (confirm('정말로 모든 헬스장을 삭제하시겠습니까?')) {
      try {
        await axiosInstance.delete(`${SAPIBase}/gyms/all`);
        alert('모든 헬스장이 성공적으로 삭제되었습니다.');
        window.location.reload(); // 삭제 후 새로고침
      } catch (err: any) {
        alert(err.response?.data?.error || '모든 헬스장을 삭제하는 데 실패했습니다.');
      }
    }
  };

  const handleAddEquipment = () => {
    if (editGym) {
      setEditGym({
        ...editGym,
        equipment: [...editGym.equipment, ''],
      });
    }
  };

  const handleUpdateEquipment = (index: number, value: string) => {
    if (editGym) {
      const updatedEquipment = [...editGym.equipment];
      updatedEquipment[index] = value;
      setEditGym({ ...editGym, equipment: updatedEquipment });
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-black">
      <section
        className="text-center rounded-lg py-20 bg-white w-full"
        style={{
            backgroundImage: "url('/images/background.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        }}
        >
        <section className="relative text-center rounded-lg py-20 bg-hero-pattern bg-cover bg-center w-full">
            <div className="absolute inset-0 bg-black opacity-50"></div>
            <div className="relative z-10">
                <h1 className="text-5xl font-bold mb-4 text-white">Welcome to Healcome KAIST</h1>
                <p className="text-xl text-gray-200 mb-8">
                당신의 운동을 더 스마트하게 관리하세요.
                </p>
            </div>
        </section>
      </section>
      <h1 className="text-3xl font-bold my-16 text-center">내 헬스장</h1>
      {isLoading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="w-full max-w-4xl">
          <div className="mb-8 flex justify-end space-x-2">
            <button
                onClick={openAddGymModal}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-700"
            >
                헬스장 추가
            </button>
            <button
                onClick={handleDeleteAllGyms}
                className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-700"
            >
                전체 삭제
            </button>
            </div>
          <h2 className="text-xl font-semibold mb-3">헬스장 목록</h2>
          <div className="bg-white p-4 rounded-lg shadow">
            <ul>
                {gyms.map((gym) => (
                <li
                    key={gym.id}
                    className="flex justify-between items-center p-2 border-b cursor-pointer hover:bg-gray-100"
                    onClick={() => openGymModal(gym)}
                >
                    <span className="font-bold">{gym.name}</span>
                    <span className="text-sm text-gray-500">
                    {gym.notes.length > 30 ? `${gym.notes.slice(0, 30)}...` : gym.notes}
                    </span>
                </li>
                ))}
            </ul>

            <div className="flex justify-center mt-4">
                {[...Array(totalPages)].map((_, index) => (
                <button
                    key={index}
                    className={`mx-1 px-3 py-1 rounded ${
                    currentPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'
                    }`}
                    onClick={() => setCurrentPage(index + 1)}
                >
                    {index + 1}
                </button>
                ))}
            </div>
            </div>
        </div>
      )}

      <Modal
        isOpen={isAddModalOpen}
        onRequestClose={closeAddGymModal}
        contentLabel="헬스장 추가"
        className="modal"
        overlayClassName="overlay"
        ariaHideApp={false}
      >
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4 text-black">헬스장 추가</h2>
          <input
            type="text"
            placeholder="헬스장 이름"
            value={newGym.name}
            onChange={(e) => setNewGym({ ...newGym, name: e.target.value })}
            className="w-full border p-2 mb-2 text-black"
          />
          <textarea
            placeholder="특이사항"
            value={newGym.notes}
            onChange={(e) => setNewGym({ ...newGym, notes: e.target.value })}
            className="w-full border p-2 mb-4 text-black"
          />
          <div className="overflow-y-auto max-h-40">
          {newGym.equipment.map((item, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
                <input
                type="text"
                value={item}
                onChange={(e) => handleNewEquipmentChange(index, e.target.value.replace(/\s+/g, ''))} // 띄어쓰기 제거
                className="flex-1 border p-2 text-black"
                placeholder={`운동기구 ${index + 1}`}
                />
                {index === newGym.equipment.length - 1 && (
                <button
                    onClick={handleAddEquipmentField}
                    className="px-2 py-1 bg-green-500 text-white rounded-lg hover:bg-green-700"
                >
                    +
                </button>
                )}
            </div>
            ))}
          </div>
          <button
            onClick={handleAddGym}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700 mr-2"
          >
            추가
          </button>
          <button
            onClick={closeAddGymModal}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-700"
          >
            취소
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeGymModal}
        contentLabel="헬스장 정보"
        className="modal"
        overlayClassName="overlay"
        ariaHideApp={false}
      >
        {selectedGym && editGym && (
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4 text-black">헬스장 수정</h2>
            <input
              type="text"
              value={editGym.name}
              onChange={(e) => setEditGym({ ...editGym, name: e.target.value })}
              className="w-full border p-2 mb-2 text-black"
              placeholder="헬스장 이름"
            />
            <textarea
              value={editGym.notes}
              onChange={(e) => setEditGym({ ...editGym, notes: e.target.value })}
              className="w-full border p-2 mb-4 text-black"
              placeholder="특이사항"
            />
            <div className="overflow-y-auto max-h-40">
            {editGym.equipment.map((item, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                    type="text"
                    value={item}
                    onChange={(e) => handleUpdateEquipment(index, e.target.value.replace(/\s+/g, ''))} // 띄어쓰기 제거
                    className="flex-1 border p-2 text-black"
                    placeholder={`운동기구 ${index + 1}`}
                    />
                    {index === editGym.equipment.length - 1 && (
                    <button
                        onClick={handleAddEquipment}
                        className="px-2 py-1 bg-green-500 text-white rounded-lg hover:bg-green-700"
                    >
                        +
                    </button>
                    )}
                </div>
                ))}
            </div>
            <div className="mt-4 flex justify-between">
              <button
                onClick={handleDeleteGym}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-700"
              >
                삭제
              </button>
              <button
                onClick={handleUpdateGym}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700"
              >
                수정
              </button>
            </div>
            <button
              onClick={closeGymModal}
              className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-700"
            >
              닫기
            </button>
          </div>
        )}
      </Modal>

      <style jsx global>{`
        .modal {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 8px;
            max-width: 500px;
            width: 100%;
            z-index: 1050; /* 높은 z-index 값 */
        }
        .overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.75);
            z-index: 1040; /* 모달 뒤 오버레이 */
        }
      `}</style>

    </main>
  );
}
  