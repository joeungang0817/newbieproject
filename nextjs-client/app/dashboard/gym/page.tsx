'use client';

import { useState, useEffect } from 'react';
import axiosInstance from '@/app/utils/axiosInstance';
import { SAPIBase } from '@/app/lib/api';
import { useRouter } from 'next/navigation';
import Modal from 'react-modal';

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
  const [newGym, setNewGym] = useState({ name: '', equipment: '', notes: '' });

  const router = useRouter();
  const limit = 10;

  // Fetch gyms data
  useEffect(() => {
    const fetchGyms = async () => {
      try {
        const response = await axiosInstance.get(`${SAPIBase}/gyms`, {
          params: { page: currentPage, limit },
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

    fetchGyms();
  }, [currentPage]);

  // Open modals
  const openGymModal = (gym: Gym) => {
    setSelectedGym(gym);
    setIsModalOpen(true);
  };

  const openAddGymModal = () => {
    setIsAddModalOpen(true);
  };

  const closeGymModal = () => {
    setIsModalOpen(false);
    setSelectedGym(null);
  };

  const closeAddGymModal = () => {
    setIsAddModalOpen(false);
    setNewGym({ name: '', equipment: '', notes: '' });
  };

  // Handle gym addition
  const handleAddGym = async () => {
    try {
      await axiosInstance.post(`${SAPIBase}/gyms`, {
        name: newGym.name,
        equipment: newGym.equipment.split(',').map((item) => item.trim()),
        notes: newGym.notes,
      });
      setNewGym({ name: '', equipment: '', notes: '' });
      setCurrentPage(1);
      alert('헬스장이 성공적으로 추가되었습니다.');
      closeAddGymModal();
      
    } catch (err: any) {
      alert(err.response?.data?.error || '헬스장을 추가하는 데 실패했습니다.');
    }
  };

  // Handle gym deletion
  const handleDeleteGym = async (gymId: number) => {
    if (confirm('정말로 이 헬스장을 삭제하시겠습니까?')) {
      try {
        await axiosInstance.delete(`${SAPIBase}/gyms/${gymId}`);
        setGyms(gyms.filter((gym) => gym.id !== gymId));
        closeGymModal();
        alert('헬스장이 성공적으로 삭제되었습니다.');
      } catch (err: any) {
        alert(err.response?.data?.error || '헬스장을 삭제하는 데 실패했습니다.');
      }
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6 text-black">
      <h1 className="text-3xl font-bold mb-6">내 헬스장</h1>

      {isLoading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="w-full max-w-4xl">
          {/* Add Gym Button */}
          <div className="mb-6 text-right">
            <button
              onClick={openAddGymModal}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700"
            >
              헬스장 추가
            </button>
          </div>

          {/* Gym List */}
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
                  <span className="text-sm text-gray-500">{gym.notes}</span>
                </li>
              ))}
            </ul>

            {/* Pagination */}
            <div className="flex justify-center mt-4">
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  className={`mx-1 px-3 py-1 rounded ${
                    currentPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'
                  }`}
                  onClick={() => handlePageChange(index + 1)}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Gym Modal */}
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
          <input
            type="text"
            placeholder="운동기구 (쉼표로 구분)"
            value={newGym.equipment}
            onChange={(e) => setNewGym({ ...newGym, equipment: e.target.value })}
            className="w-full border p-2 mb-2 text-black"
          />
          <textarea
            placeholder="특이사항"
            value={newGym.notes}
            onChange={(e) => setNewGym({ ...newGym, notes: e.target.value })}
            className="w-full border p-2 mb-4 text-black"
          />
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

      {/* Gym Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeGymModal}
        contentLabel="헬스장 정보"
        className="modal"
        overlayClassName="overlay"
        ariaHideApp={false}
      >
        {selectedGym && (
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4 text-black">{selectedGym.name}</h2>
            <p className="text-black">운동기구: {selectedGym.equipment.join(', ')}</p>
            <p className="text-black">특이사항: {selectedGym.notes}</p>
            <div className="flex justify-between mt-4">
              <button
                onClick={() => handleDeleteGym(selectedGym.id)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-700"
              >
                삭제하기
              </button>
              <button
                onClick={closeGymModal}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-700"
              >
                닫기
              </button>
            </div>
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
        }
        .overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.75);
        }
      `}</style>
    </main>
  );
}
