'use client';

import { useState, useEffect } from 'react';
import axiosInstance from '@/app/utils/axiosInstance';
import { SAPIBase } from '@/app/lib/api';
import Modal from 'react-modal';
import { PlusIcon, TrashIcon, PencilIcon, EyeIcon } from '@heroicons/react/solid';

interface Equipment {
  name: string;
  sets: number;
  reps: number;
  weight: number;
}

interface Routine {
  id: number;
  user_id: number;
  name: string;
  description: string;
  public: boolean;
  created_at: string;
  author?: string;
  tier?: string;
  equipment: Equipment[];
}

interface RoutinesResponse {
  data: Routine[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

interface Gym {
  id: number;
  name: string;
  equipment: string[]; // 헬스장에 있는 운동기구 목록
  notes: string;
}

interface GymsResponse {
  data: Gym[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export default function RoutinesPage() {
  
  useEffect(() => {
    const rootElement = document.querySelector('#__next') as HTMLElement;
    Modal.setAppElement(rootElement);
  }, []);

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [editRoutine, setEditRoutine] = useState<Routine | null>(null);
  const [newRoutine, setNewRoutine] = useState({
    name: '',
    description: '',
    public: false,
    equipment: [{ name: '', sets: 1, reps: 1, weight: 1 }],
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [view, setView] = useState<'mine' | 'all'>('mine');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isUseModalOpen, setIsUseModalOpen] = useState(false);

  const [gyms, setGyms] = useState<Gym[]>([]);
  const [gymId, setGymId] = useState<number>(0);

  const limit = 10;

  // 사용자 ID를 가져오는 방법에 따라 수정 필요
  // 예: Context 또는 로컬 스토리지에서 가져오기
  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

  useEffect(() => {
    fetchRoutines(currentPage, view);
  }, [currentPage, view]);

  useEffect(() => {
    if (isUseModalOpen) {
      fetchGymsForUse();
    }
  }, [isUseModalOpen]);

  // 루틴 목록 가져오기
  const fetchRoutines = async (page: number, view: 'mine' | 'all') => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get<RoutinesResponse>(`${SAPIBase}/routines`, {
        params: { filter: view, page, limit },
      });
      setRoutines(response.data.data);
      setCurrentPage(response.data.currentPage);
      setTotalPages(response.data.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.error || '루틴 목록을 가져오는 데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 헬스장 목록 가져오기 (루틴 사용 시)
  const fetchGymsForUse = async () => {
    try {
      const response = await axiosInstance.get<GymsResponse>(`${SAPIBase}/gyms`, {
        params: { page: 1, limit: 10 }, // 모든 헬스장을 가져오기 위해 페이지 및 제한 조정
      });
      setGyms(response.data.data);
    } catch (err: any) {
      alert(err.response?.data?.error || '헬스장 목록을 가져오는 데 실패했습니다.');
    }
  };

  // 모달 열기 및 닫기 핸들러
  const openAddModal = () => {
    setNewRoutine({
      name: '',
      description: '',
      public: false,
      equipment: [{ name: '', sets: 1, reps: 1, weight: 1 }],
    });
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
  };

  const openEditModal = (routine: Routine) => {
    setEditRoutine({ ...routine });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditRoutine(null);
  };

  const openDetailModal = (routine: Routine) => {
    setSelectedRoutine(routine);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedRoutine(null);
  };

  const openUseModal = (routine: Routine) => {
    setSelectedRoutine(routine);
    setGymId(0);
    setIsUseModalOpen(true);
  };

  const closeUseModal = () => {
    setIsUseModalOpen(false);
    setSelectedRoutine(null);
    setGymId(0);
  };

  // 루틴 추가 핸들러
  const handleAddRoutine = async () => {
    // 이름과 최소 1개의 운동기구가 필요함
    if (!newRoutine.name.trim()) {
      alert('루틴 이름을 입력해주세요.');
      return;
    }
    if (newRoutine.equipment.length === 0 || newRoutine.equipment.some(eq => eq.name.trim() === '')) {
      alert('루틴을 추가하기 위해선 운동기구를 하나 이상, 각 항목마다 공란이 없도록 입력해주세요.');
      return;
    }

    try {
      await axiosInstance.post(`${SAPIBase}/routines`, {
        name: newRoutine.name,
        description: newRoutine.description,
        public: newRoutine.public,
        equipment: newRoutine.equipment,
      });
      alert('루틴이 성공적으로 추가되었습니다.');
      closeAddModal();
      fetchRoutines(currentPage, view);
    } catch (err: any) {
      alert(err.response?.data?.error || '루틴을 추가하는 데 실패했습니다.');
    }
  };

  // 루틴 수정 핸들러
  const handleEditRoutine = async () => {
    if (!editRoutine) return;

    if (!editRoutine.name.trim()) {
      alert('루틴 이름을 입력해주세요.');
      return;
    }
    if (editRoutine.equipment.length === 0 || editRoutine.equipment.some(eq => eq.name.trim() === '')) {
      alert('루틴을 수정하기 위해선 운동기구를 하나 이상, 각 항목마다 공란이 없도록 입력해주세요.');
      return;
    }

    try {
      await axiosInstance.patch(`${SAPIBase}/routines/${editRoutine.id}`, {
        name: editRoutine.name,
        description: editRoutine.description,
        public: Boolean(editRoutine.public),
        equipment: editRoutine.equipment,
      });
      alert('루틴이 성공적으로 수정되었습니다.');
      closeEditModal();
      fetchRoutines(currentPage, view);
    } catch (err: any) {
      alert(err.response?.data?.error || '루틴을 수정하는 데 실패했습니다.');
    }
  };

  // 루틴 삭제 핸들러
  const handleDeleteRoutine = async (id: number) => {
    if (!confirm('정말로 이 루틴을 삭제하시겠습니까?')) return;

    try {
      await axiosInstance.delete(`${SAPIBase}/routines/${id}`);
      alert('루틴이 성공적으로 삭제되었습니다.');
      fetchRoutines(currentPage, view);
    } catch (err: any) {
      alert(err.response?.data?.error || '루틴을 삭제하는 데 실패했습니다.');
    }
  };

  const handleDeleteAllRoutine = async () => {
    if (!confirm('정말로 모든 루틴을 삭제하시겠습니까?')) return;

    try {
      await axiosInstance.delete(`${SAPIBase}/routines`);
      alert('루틴이 성공적으로 삭제되었습니다.');
      fetchRoutines(currentPage, view);
    } catch (err: any) {
      alert(err.response?.data?.error || '루틴을 삭제하는 데 실패했습니다.');
    }
  };

  const handleUseRoutine = async () => {
    if (!selectedRoutine) return;
    if (gymId === 0) {
        alert('헬스장을 선택해주세요.');
        return;
    }

    try {
        await axiosInstance.post(`${SAPIBase}/routines/logs`, { routineId: selectedRoutine.id, gymId: gymId });
        alert('루틴이 성공적으로 사용되었습니다.');
        closeUseModal();
    } catch (err: any) {
        alert(err.response?.data?.error || '루틴 사용에 실패했습니다.');
    }
};


  // 루틴 추가 운동기구 필드 변경 핸들러
  const handleNewRoutineEquipmentChange = (index: number, field: keyof Equipment, value: any) => {
    const updatedEquipment = [...newRoutine.equipment];
    updatedEquipment[index] = {
      ...updatedEquipment[index],
      [field]: value,
    };
    setNewRoutine({ ...newRoutine, equipment: updatedEquipment });
  };

  // 루틴 수정 운동기구 필드 변경 핸들러
  const handleEditRoutineEquipmentChange = (index: number, field: keyof Equipment, value: any) => {
    if (!editRoutine) return;
    const updatedEquipment = [...editRoutine.equipment];
    updatedEquipment[index] = {
      ...updatedEquipment[index],
      [field]: value,
    };
    setEditRoutine({ ...editRoutine, equipment: updatedEquipment });
  };

  // 루틴 추가 운동기구 필드 추가 핸들러
  const addNewRoutineEquipmentField = () => {
    setNewRoutine({
      ...newRoutine,
      equipment: [...newRoutine.equipment, { name: '', sets: 1, reps: 1, weight: 1 }],
    });
  };

  // 루틴 수정 운동기구 필드 추가 핸들러
  const addEditRoutineEquipmentField = () => {
    if (!editRoutine) return;
    setEditRoutine({
      ...editRoutine,
      equipment: [...editRoutine.equipment, { name: '', sets: 1, reps: 1, weight: 1 }],
    });
  };

  // 루틴 추가 운동기구 필드 제거 핸들러
  const removeNewRoutineEquipmentField = (index: number) => {
    const updatedEquipment = [...newRoutine.equipment];
    updatedEquipment.splice(index, 1);
    setNewRoutine({ ...newRoutine, equipment: updatedEquipment });
  };

  // 루틴 수정 운동기구 필드 제거 핸들러
  const removeEditRoutineEquipmentField = (index: number) => {
    if (!editRoutine) return;
    const updatedEquipment = [...editRoutine.equipment];
    updatedEquipment.splice(index, 1);
    setEditRoutine({ ...editRoutine, equipment: updatedEquipment });
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
      <h1 className="text-3xl font-bold my-16 text-center">루틴 관리</h1>

      {/* 로딩 및 에러 상태 */}
      {isLoading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="w-full max-w-6xl">

          {/* 내 루틴일 때 루틴 추가 버튼 */}
          {view === 'mine' && (
            <div className="mb-8 flex justify-end space-x-2">
              <button
                  onClick={openAddModal}
                  className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-700">
                  루틴 추가
              </button>
              <button
                onClick={handleDeleteAllRoutine}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-700"
            >
                전체 삭제
            </button>
            </div>

          )}

          {/* 뷰 전환 버튼 */}
          <div className="mb-8 flex justify-end space-x-2">
            <button
                onClick={() => { setView('mine'); setCurrentPage(1); }}
                className={`px-2 py-1 rounded ${
                    view === 'mine' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                } hover:bg-blue-600`}
            >
                내 루틴 보기
            </button>
            <button
                onClick={() => { setView('all'); setCurrentPage(1); }}
                className={`px-2 py-1 rounded ${
                    view === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                } hover:bg-blue-600`}
            >
                모든 사람의 루틴 보기
            </button>
          </div>

          {/* 루틴 목록 */}
          <div className="bg-white p-6 rounded-lg shadow">
            {!routines ? (
              <div className="text-center">
                <p className="text-gray-500"></p>
              </div>
            ) : (
              <>
                <div className='overflow-x-auto'>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">설명</th>
                        {view === 'mine' && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">공개 여부</th>
                        )}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">운동내용</th>
                        {view === 'all' && (
                          <>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작성자</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tier</th>
                          </>
                        )}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사용</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {routines.map(routine => (
                        <tr key={routine.id} className="hover:bg-gray-100">
                          <td
                            className="px-6 py-4 whitespace-nowrap cursor-pointer text-blue-600 hover:underline font-bold"
                            onClick={() => openDetailModal(routine)}
                          >
                            {routine.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-bold truncate max-w-xs">{routine.description}</td>
                          {view === 'mine' && (
                            <td className="px-6 py-4 whitespace-nowrap font-bold">
                              {routine.public ? '공개' : '비공개'}
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap font-bold ">
                            {routine.equipment.map((eq, idx) => (
                              <div key={idx}>
                                {eq.name} - {eq.sets}세트 x {eq.reps}회 @ {eq.weight}kg
                              </div>
                            ))}
                          </td>
                          {view === 'all' && (
                            <>
                              <td className="px-6 py-4 whitespace-nowrap font-bold">{routine.author || '나'}</td>
                              <td className="px-6 py-4 whitespace-nowrap font-bold">{routine.tier || '-'}</td>
                            </>
                          )}
                            <td className="px-6 py-4 whitespace-nowrap flex space-x-2">
                              <button
                                  onClick={() => openUseModal(routine)}
                                  className="flex items-center text-green-500 hover:text-green-700 font-bold"
                              >
                                  <EyeIcon className="h-5 w-5 mr-1" />
                              </button>
                            </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

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
              </>
            )}
          </div>
        </div>
      )}

      {/* 루틴 추가 모달 */}
      <Modal
        isOpen={isAddModalOpen}
        onRequestClose={closeAddModal}
        contentLabel="루틴 추가"
        className="modal"
        overlayClassName="overlay"
        ariaHideApp={false}
      >
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4 text-black">루틴 추가</h2>
          <input
            type="text"
            placeholder="루틴 이름"
            value={newRoutine.name}
            onChange={(e) => setNewRoutine({ ...newRoutine, name: e.target.value })}
            className="w-full border p-2 mb-2 text-black"
          />
          <textarea
            placeholder="설명"
            value={newRoutine.description}
            onChange={(e) => setNewRoutine({ ...newRoutine, description: e.target.value })}
            className="w-full border p-2 mb-2 text-black"
          />
          <h3 className="text-lg font-semibold mb-2 text-black">운동내용</h3>
          {newRoutine.equipment.map((eq, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                placeholder="기구 이름"
                value={eq.name}
                onChange={(e) => handleNewRoutineEquipmentChange(index, 'name', e.target.value.replace(/\s/g, ''))}
                className="flex-1 border p-2 text-black"
              />
              <input
                type="number"
                placeholder="세트"
                min="1"
                value={eq.sets}
                onChange={(e) => handleNewRoutineEquipmentChange(index, 'sets', Number(e.target.value))}
                className="w-20 border p-2 text-black"
              />
              <input
                type="number"
                placeholder="회"
                min="1"
                value={eq.reps}
                onChange={(e) => handleNewRoutineEquipmentChange(index, 'reps', Number(e.target.value))}
                className="w-20 border p-2 text-black"
              />
              <input
                type="number"
                placeholder="중량 (kg)"
                min="1"
                value={eq.weight}
                onChange={(e) => handleNewRoutineEquipmentChange(index, 'weight', Number(e.target.value))}
                className="w-24 border p-2 text-black"
              />
              {newRoutine.equipment.length > 1 && (
                <button
                  onClick={() => removeNewRoutineEquipmentField(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  -
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addNewRoutineEquipmentField}
            className="flex items-center text-blue-500 hover:text-blue-700 mb-4"
          >
            <PlusIcon className="h-5 w-5 mr-1" />
            운동내용 추가
          </button>
          <label className="flex items-center mb-4 text-black">
            <input
              type="checkbox"
              checked={Boolean(newRoutine.public)}
              onChange={(e) => setNewRoutine({ ...newRoutine, public: e.target.checked })}
              className="mr-2"
            />
            공개 여부
          </label>
          <div className="flex justify-end space-x-2">
            <button
              onClick={handleAddRoutine}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700"
            >
              추가
            </button>
            <button
              onClick={closeAddModal}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-700"
            >
              취소
            </button>
          </div>
        </div>
      </Modal>

      {/* 루틴 수정 모달 */}
      <Modal
        isOpen={isEditModalOpen}
        onRequestClose={closeEditModal}
        contentLabel="루틴 수정"
        className="modal"
        overlayClassName="overlay"
        ariaHideApp={false}
      >
        {editRoutine && (
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4 text-black">루틴 수정</h2>
            <input
              type="text"
              placeholder="루틴 이름"
              value={editRoutine.name}
              onChange={(e) => setEditRoutine({ ...editRoutine, name: e.target.value })}
              className="w-full border p-2 mb-2 text-black"
            />
            <textarea
              placeholder="설명"
              value={editRoutine.description}
              onChange={(e) => setEditRoutine({ ...editRoutine, description: e.target.value })}
              className="w-full border p-2 mb-2 text-black"
            />
            <h3 className="text-lg font-semibold mb-2 text-black">운동내용</h3>
            {editRoutine.equipment.map((eq, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  placeholder="기구 이름"
                  value={eq.name}
                  onChange={(e) => handleEditRoutineEquipmentChange(index, 'name', e.target.value)}
                  className="flex-1 border p-2 text-black"
                />
                <input
                  type="number"
                  placeholder="세트"
                  min="1"
                  value={eq.sets}
                  onChange={(e) => handleEditRoutineEquipmentChange(index, 'sets', Number(e.target.value))}
                  className="w-20 border p-2 text-black"
                />
                <input
                  type="number"
                  placeholder="회"
                  min="1"
                  value={eq.reps}
                  onChange={(e) => handleEditRoutineEquipmentChange(index, 'reps', Number(e.target.value))}
                  className="w-20 border p-2 text-black"
                />
                <input
                  type="number"
                  placeholder="중량 (kg)"
                  min="1"
                  value={eq.weight}
                  onChange={(e) => handleEditRoutineEquipmentChange(index, 'weight', Number(e.target.value))}
                  className="w-24 border p-2 text-black"
                />
                {editRoutine.equipment.length > 1 && (
                  <button
                    onClick={() => removeEditRoutineEquipmentField(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    -
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addEditRoutineEquipmentField}
              className="flex items-center text-blue-500 hover:text-blue-700 mb-4"
            >
              <PlusIcon className="h-5 w-5 mr-1" />
              운동내용 추가
            </button>
            <label className="flex items-center mb-4 text-black">
              <input
                type="checkbox"
                checked={editRoutine.public}
                onChange={(e) => setEditRoutine({ ...editRoutine, public: e.target.checked })}
                className="mr-2"
              />
              공개 여부
            </label>
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleEditRoutine}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
              >
                <PencilIcon className="h-5 w-5 mr-1" />
                수정
              </button>
              <button
                onClick={() => handleDeleteRoutine(editRoutine.id)}
                className="flex items-center px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700"
              >
                <TrashIcon className="h-5 w-5 mr-1" />
                삭제
              </button>
            </div>
            <div className='flex justify-end space-x-2'>
              <button
                onClick={closeEditModal}
                className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-700"
              >
                닫기
              </button>
              </div>
          </div>
        )}
      </Modal>

      {/* 루틴 상세 보기 모달 */}
      <Modal
        isOpen={isDetailModalOpen}
        onRequestClose={closeDetailModal}
        contentLabel="루틴 상세"
        className="modal"
        overlayClassName="overlay"
        ariaHideApp={false}
      >
        {selectedRoutine && (
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4 text-black">{selectedRoutine.name}</h2>
            <p className="mb-4 text-black">{selectedRoutine.description}</p>
            <h4 className="text-md font-medium text-black">운동내용</h4>
            <ul className="list-disc list-inside mb-4 text-black">
              {selectedRoutine.equipment.map((eq, idx) => (
                <li key={idx}>
                  {eq.name} - {eq.sets}세트 x {eq.reps}회 @ {eq.weight}kg
                </li>
              ))}
            </ul>
            {view === 'mine' && (
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => { openEditModal(selectedRoutine); closeDetailModal(); }}
                  className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
                >
                  <PencilIcon className="h-5 w-5 mr-1" />
                  수정
                </button>
                <button
                  onClick={() => { handleDeleteRoutine(selectedRoutine.id); closeDetailModal(); }}
                  className="flex items-center px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700"
                >
                  <TrashIcon className="h-5 w-5 mr-1" />
                  삭제
                </button>
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <button
                onClick={closeDetailModal}
                className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-700"
              >
                닫기
              </button>
              </div>
          </div>
        )}
      </Modal>

      {/* 루틴 사용 모달 */}
      <Modal
        isOpen={isUseModalOpen}
        onRequestClose={closeUseModal}
        contentLabel="루틴 사용"
        className="modal"
        overlayClassName="overlay"
        ariaHideApp={false}
      >
        {selectedRoutine && (
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4 text-black">루틴 사용</h2>
            <h3 className="text-lg font-semibold text-black">{selectedRoutine.name}</h3>
            <p className="mb-4 text-black">{selectedRoutine.description}</p>
            <label className="block text-lg font-medium mb-2 text-black">헬스장 선택</label>
            <select
              value={gymId}
              onChange={(e) => setGymId(Number(e.target.value))}
              className="w-full border p-2 mb-4 text-black"
            >
              <option value={0}>선택하세요</option>
              {gyms.map(gym => (
                <option key={gym.id} value={gym.id}>{gym.name}</option>
              ))}
            </select>
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleUseRoutine}
                disabled={gymId === 0}
                className={`px-4 py-2 rounded ${
                  gymId === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-700'
                }`}
              >
                사용
              </button>
              <button
                onClick={closeUseModal}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-700"
              >
                취소
              </button>
            </div>
          </div>
        )}
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
          max-width: 600px;
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
