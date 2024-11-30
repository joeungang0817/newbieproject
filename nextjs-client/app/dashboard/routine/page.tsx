'use client';

import { useState, useEffect } from 'react';
import axiosInstance from '@/app/utils/axiosInstance';
import Modal from 'react-modal';

interface Routine {
  id: number;
  name: string;
  gymId: number;
  public: boolean;
  equipment: {
    name: string;
    sets: number;
    reps: number;
    weight: number;
  }[];
}

interface Gym {
  id: number;
  name: string;
  equipment: string[];
}

interface Log {
  id: number;
  routineId: number;
  routineName: string;
  usedAt: string;
}

export default function RoutinePage() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [logs, setLogs] = useState<Record<string, Log[]>>({});
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [filter, setFilter] = useState<'mine' | 'all'>('mine'); // 'mine' or 'all'
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [newRoutine, setNewRoutine] = useState<Routine>({
    id: 0,
    name: '',
    gymId: 0,
    public: false,
    equipment: [],
  });
  const [error, setError] = useState<string | null>(null);

  const fetchRoutines = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get('/routines', { params: { filter } });
      setRoutines(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || '루틴 목록을 가져오는 데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGyms = async () => {
    try {
      const response = await axiosInstance.get('/gyms');
      setGyms(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || '헬스장 목록을 가져오는 데 실패했습니다.');
    }
  };

  useEffect(() => {
    fetchRoutines();
    fetchGyms();
  }, [filter]);

  const toggleFilter = (newFilter: 'mine' | 'all') => {
    setFilter(newFilter);
  };

  const fetchLogs = async () => {
    try {
      const response = await axiosInstance.get('/routines/logs');
      const groupedLogs = response.data.reduce((acc: Record<string, Log[]>, log: Log) => {
        const date = new Date(log.usedAt).toLocaleDateString();
        acc[date] = acc[date] || [];
        acc[date].push(log);
        return acc;
      }, {});
      setLogs(groupedLogs);
    } catch (err: any) {
      setError(err.response?.data?.error || '로그를 가져오는 데 실패했습니다.');
    }
  };

  useEffect(() => {
    fetchRoutines();
    fetchGyms();
    fetchLogs();
  }, []);

  const openRoutineModal = (routine?: Routine) => {
    if (routine) {
      setSelectedRoutine(routine);
      setNewRoutine({
        ...routine,
        equipment: [...routine.equipment],
      });
    } else {
      setSelectedRoutine(null);
      setNewRoutine({
        id: 0,
        name: '',
        gymId: 0,
        public: false,
        equipment: [],
      });
    }
    setIsRoutineModalOpen(true);
  };

  const closeRoutineModal = () => {
    setIsRoutineModalOpen(false);
    setSelectedRoutine(null);
  };

  const handleSaveRoutine = async () => {
    try {
      if (selectedRoutine) {
        await axiosInstance.patch(`/routines/${selectedRoutine.id}`, newRoutine);
        alert('루틴이 성공적으로 수정되었습니다.');
      } else {
        await axiosInstance.post('/routines', newRoutine);
        alert('루틴이 성공적으로 추가되었습니다.');
      }
      fetchRoutines();
      closeRoutineModal();
    } catch (err: any) {
      alert(err.response?.data?.error || '루틴 저장에 실패했습니다.');
    }
  };

  const handleDeleteRoutine = async (routineId: number) => {
    if (confirm('정말로 이 루틴을 삭제하시겠습니까?')) {
      try {
        await axiosInstance.delete(`/routines/${routineId}`);
        alert('루틴이 성공적으로 삭제되었습니다.');
        fetchRoutines();
      } catch (err: any) {
        alert(err.response?.data?.error || '루틴 삭제에 실패했습니다.');
      }
    }
  };

  const handleUseRoutine = async (routineId: number) => {
    try {
      await axiosInstance.post('/routines/logs', { routineId });
      alert('루틴이 성공적으로 사용되었습니다.');
      fetchLogs();
    } catch (err: any) {
      alert(err.response?.data?.error || '루틴을 사용하는 데 실패했습니다.');
    }
  };

  const handleDeleteLog = async (logId: number) => {
    if (confirm('정말로 이 로그를 삭제하시겠습니까?')) {
      try {
        await axiosInstance.delete(`/routines/logs/${logId}`);
        alert('로그가 성공적으로 삭제되었습니다.');
        fetchLogs();
      } catch (err: any) {
        alert(err.response?.data?.error || '로그 삭제에 실패했습니다.');
      }
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold my-8">루틴 페이지</h1>
        {/* Filter Buttons */}
        <div className="mb-4 flex justify-center space-x-4">
            <button
            onClick={() => toggleFilter('mine')}
            className={`px-4 py-2 rounded-lg ${
                filter === 'mine' ? 'bg-blue-500 text-white' : 'bg-gray-300'
            }`}
            >
            내 루틴 보기
            </button>
            <button
            onClick={() => toggleFilter('all')}
            className={`px-4 py-2 rounded-lg ${
                filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-300'
            }`}
            >
            모두 보기
            </button>
        </div>

      {/* Routine List */}
      <section className="w-full max-w-4xl mb-12">
        <h2 className="text-xl font-bold mb-4">루틴 목록</h2>
        <div className="bg-white p-4 rounded-lg shadow">
          {isLoading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            routines.map((routine) => (
              <div
                key={routine.id}
                className="p-4 border-b flex justify-between items-center"
              >
                <span className="font-bold">{routine.name}</span>
                <div className="space-x-2">
                  {/* 버튼들 */}
                  <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-700">
                    수정
                  </button>
                  <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-700">
                    삭제
                  </button>
                  <button className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-700">
                    사용하기
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <Modal
        isOpen={isRoutineModalOpen}
        onRequestClose={closeRoutineModal}
        contentLabel="루틴 추가/수정"
        className="modal"
        overlayClassName="overlay"
      >
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">{selectedRoutine ? '루틴 수정' : '루틴 추가'}</h2>
          <input
            type="text"
            placeholder="루틴 이름"
            value={newRoutine.name}
            onChange={(e) => setNewRoutine({ ...newRoutine, name: e.target.value })}
            className="w-full border p-2 mb-2 text-black"
          />
          <select
            value={newRoutine.gymId}
            onChange={(e) => setNewRoutine({ ...newRoutine, gymId: parseInt(e.target.value) })}
            className="w-full border p-2 mb-2 text-black"
          >
            <option value="0">헬스장 선택</option>
            {gyms.map((gym) => (
              <option key={gym.id} value={gym.id}>
                {gym.name}
              </option>
            ))}
          </select>
          <div className="mt-4">
            <h3 className="text-lg font-bold mb-2">운동기구 설정</h3>
            <div className="overflow-y-auto max-h-40 border rounded-lg p-2">
              {gyms
                .find((gym) => gym.id === newRoutine.gymId)?.equipment.map((equipmentName) => (
                  <div key={equipmentName} className="mb-2">
                    <h4 className="font-bold">{equipmentName}</h4>
                    <div className="flex space-x-2 mt-1">
                      <input
                        type="number"
                        placeholder="세트 수"
                        className="w-1/3 border p-2"
                        onChange={(e) =>
                          setNewRoutine((prev) => {
                            const updatedEquipment = prev.equipment.filter(
                              (item) => item.name !== equipmentName
                            );
                            updatedEquipment.push({
                              name: equipmentName,
                              sets: parseInt(e.target.value) || 0,
                              reps: 0,
                              weight: 0,
                            });
                            return { ...prev, equipment: updatedEquipment };
                          })
                        }
                      />
                      <input
                        type="number"
                        placeholder="반복 횟수"
                        className="w-1/3 border p-2"
                        onChange={(e) =>
                          setNewRoutine((prev) => {
                            const updatedEquipment = prev.equipment.filter(
                              (item) => item.name !== equipmentName
                            );
                            updatedEquipment.push({
                              name: equipmentName,
                              sets: 0,
                              reps: parseInt(e.target.value) || 0,
                              weight: 0,
                            });
                            return { ...prev, equipment: updatedEquipment };
                          })
                        }
                      />
                      <input
                        type="number"
                        placeholder="중량 (kg)"
                        className="w-1/3 border p-2"
                        onChange={(e) =>
                          setNewRoutine((prev) => {
                            const updatedEquipment = prev.equipment.filter(
                              (item) => item.name !== equipmentName
                            );
                            updatedEquipment.push({
                              name: equipmentName,
                              sets: 0,
                              reps: 0,
                              weight: parseFloat(e.target.value) || 0,
                            });
                            return { ...prev, equipment: updatedEquipment };
                          })
                        }
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
          <button
            onClick={handleSaveRoutine}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700 mr-2"
          >
            저장
          </button>
          <button
            onClick={closeRoutineModal}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-700"
          >
            취소
          </button>
        </div>
      </Modal>

      <section className="w-full max-w-4xl">
        <h2 className="text-xl font-bold mb-4">사용 기록</h2>
        <div className="bg-white p-4 rounded-lg shadow">
          {Object.keys(logs).length === 0 ? (
            <p className="text-gray-500">사용 기록이 없습니다.</p>
          ) : (
            Object.entries(logs).map(([date, logList]) => (
              <div key={date} className="mb-4">
                <h3 className="font-bold mb-2">{date}</h3>
                {logList.map((log) => (
                  <div key={log.id} className="p-2 border flex justify-between items-center">
                    <span>{log.routineName}</span>
                    <button
                      onClick={() => handleDeleteLog(log.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-700"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </section>

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
