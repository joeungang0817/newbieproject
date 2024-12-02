'use client';

import { useState, useEffect } from 'react';
import axiosInstance from '@/app/utils/axiosInstance';
import { SAPIBase } from '@/app/lib/api';
import Modal from 'react-modal';
import { PlusIcon, TrashIcon,PencilIcon } from '@heroicons/react/solid';

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
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
  const [editGym, setEditGym] = useState<Gym | null>(null);
  const [newGym, setNewGym] = useState({ name: '', equipment: [''], notes: '' });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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

  const openGymDetailModal = (gym: Gym) => {
    setSelectedGym(gym);
    setIsDetailModalOpen(true);
  };

  const closeGymDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedGym(null);
  };

  const openGymEditModal = () => {
    if (selectedGym) {
      setEditGym({ ...selectedGym });
      setIsEditModalOpen(true);
      setIsDetailModalOpen(false); // 상세 모달 닫기 (선택 사항)
    }
  };

  const closeGymEditModal = () => {
    setIsEditModalOpen(false);
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

  const handleRemoveEquipmentField = () => {
    setNewGym((prev) => ({
      ...prev,
      equipment: prev.equipment.filter((_, i) => i !== prev.equipment.length - 1),
    }));
  };

  const handleNewEquipmentChange = (index: number, value: string) => {
    setNewGym((prev) => {
      const updatedEquipment = [...prev.equipment];
      updatedEquipment[index] = value;
      return { ...prev, equipment: updatedEquipment };
    });
  };

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
      fetchGyms(currentPage); // 새로고침 대신 목록 갱신
    } catch (err: any) {
      alert(err.response?.data?.error || '헬스장을 추가하는 데 실패했습니다.');
    }
  };
  
  const handleUpdateGym = async () => {
    if (!editGym || !editGym.name.trim()) {
      alert('헬스장 이름을 입력해주세요.');
      return;
    }
    if (
      editGym.equipment.length === 0 ||
      editGym.equipment.some((item) => item.trim() === '')
    ) {
      alert('헬스장을 수정하기 위해선 운동기구를 하나 이상, 각 항목마다 공란이 없도록 입력해주세요.');
      return;
    }
  
    try {
      await axiosInstance.patch(`${SAPIBase}/gyms/${editGym.id}`, {
        name: editGym.name,
        equipment: editGym.equipment.map((item) => item.replace(/\s+/g, '')), // 띄어쓰기 제거
        notes: editGym.notes,
      });
      alert('헬스장이 성공적으로 수정되었습니다.');
      closeGymEditModal();
      fetchGyms(currentPage); // 목록 갱신
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
        closeGymDetailModal();
        fetchGyms(currentPage); // 목록 갱신
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
        fetchGyms(currentPage); // 목록 갱신
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

  const handleRemoveEquipment = () => {
    if (editGym) {
      setEditGym({
        ...editGym,
        equipment: editGym.equipment.filter((_, i) => i !== editGym.equipment.length - 1),
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
      {/* 헤더 섹션 */}
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

      {/* 페이지 제목 */}
      <h1 className="text-3xl font-bold my-16 text-center">내 헬스장</h1>

      {/* 로딩 및 에러 상태 */}
      {isLoading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="w-full max-w-4xl">
          {/* 헬스장 추가 및 전체 삭제 버튼 */}
          <div className="mb-8 flex justify-end space-x-2">
            <button
                onClick={openAddGymModal}
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-700"
            >
                헬스장 추가
            </button>
            <button
                onClick={handleDeleteAllGyms}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-700"
            >
                전체 삭제
            </button>
          </div>

          {/* 헬스장 목록 */}
          <div className="bg-white p-4 rounded-lg shadow">
            <ul>
                {gyms.map((gym) => (
                <li
                    key={gym.id}
                    className="flex justify-between items-center p-2 border-b cursor-pointer hover:bg-gray-100"
                    onClick={() => openGymDetailModal(gym)}
                >
                    <span className="font-bold">{gym.name}</span>
                    <span className="text-sm text-gray-500">
                    {gym.notes.length > 30 ? `${gym.notes.slice(0, 30)}...` : gym.notes}
                    </span>
                </li>
                ))}
            </ul>

            {/* 페이지 네비게이션 */}
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

      {/* 헬스장 상세 모달 */}
      <Modal
        isOpen={isDetailModalOpen}
        onRequestClose={closeGymDetailModal}
        contentLabel="헬스장 상세 정보"
        className="modal"
        overlayClassName="overlay"
        ariaHideApp={false}
      >
        {selectedGym && (
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4 text-black">{selectedGym.name}</h2>
            <p className="mb-2 text-black break-words whitespace-normal">{selectedGym.notes}</p>
            <p className="mb-4 text-black"><strong>운동기구</strong></p>
            <ul className="list-disc list-inside mb-4 text-black">
              {selectedGym.equipment.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            <div className="flex justify-end space-x-2">
              <button
                onClick={openGymEditModal}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
              >
                <PencilIcon className="h-5 w-5 mr-1" />
                수정
              </button>
              <button
                onClick={handleDeleteGym}
                className="flex items-center px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700"
              >
                <TrashIcon className="h-5 w-5 mr-1" />
                삭제
              </button>
            </div>
            <div className='flex justify-end mt-4'>
              <button
                onClick={closeGymDetailModal}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-700"
              >
                닫기
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* 헬스장 수정 모달 */}
      <Modal
        isOpen={isEditModalOpen}
        onRequestClose={closeGymEditModal}
        contentLabel="헬스장 수정"
        className="modal"
        overlayClassName="overlay"
        ariaHideApp={false}
      >
        {editGym && (
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
            <h3 className="text-lg font-semibold mb-2 text-black">운동기구</h3>
            <div className="overflow-y-auto max-h-40">
              {editGym.equipment.map((item, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleUpdateEquipment(index, e.target.value.replace(/\s+/g, ''))}
                    className="flex-1 border p-2 text-black"
                    placeholder={`운동기구 ${index + 1}`}
                  />
                </div>
              ))}
            </div>
            <div className="flex space-x-2 mb-4">
              <button
                onClick={handleAddEquipment}
                className="flex items-center text-blue-500 hover:text-blue-700"
              >
                <PlusIcon className="h-5 w-5 mr-1" />
                운동기구 추가
              </button>
              {editGym.equipment.length > 1 && (
                <button
                  onClick={handleRemoveEquipment}
                  className="flex items-center text-red-500 hover:text-red-700"
                >
                  <TrashIcon className="h-5 w-5 mr-1" />
                  운동기구 삭제
                </button>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleUpdateGym}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
              >
                <PencilIcon className="h-5 w-5 mr-1" />
                수정
              </button>
              <button
                onClick={handleDeleteGym}
                className="flex items-center px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700"
              >
                <TrashIcon className="h-5 w-5 mr-1" />
                삭제
              </button>
            </div>
            <div className='flex justify-end mt-4'>
              <button
                onClick={closeGymEditModal}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-700"
              >
                닫기
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* 헬스장 추가 모달 */}
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
              </div>
            ))}

            {/* 운동기구 추가 및 삭제 버튼 */}
            <div className="flex space-x-2 mb-4">
              <button
                onClick={handleAddEquipmentField}
                className="flex items-center text-blue-500 hover:text-blue-700"
                aria-label="운동기구 추가"
              >
                <PlusIcon className="h-5 w-5 mr-1" />
                운동기구 추가
              </button>
              {newGym.equipment.length > 1 && (
                <button
                  onClick={handleRemoveEquipmentField} // 함수 호출 수정
                  className="flex items-center text-red-500 hover:text-red-700"
                  aria-label="운동기구 삭제"
                >
                  <TrashIcon className="h-5 w-5 mr-1" />
                  운동기구 삭제
                </button>
              )}
            </div>
          </div>
          <div className='flex justify-end space-x-2'>
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
        </div>
      </Modal>

      {/* 글로벌 스타일 */}
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
          max-height: 90vh;
          overflow-y: auto;
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
