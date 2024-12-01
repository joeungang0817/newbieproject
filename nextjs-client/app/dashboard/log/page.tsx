// src/pages/LogsPage.tsx

'use client';

import { useState, useEffect } from 'react';
import axiosInstance from '@/app/utils/axiosInstance';
import { SAPIBase } from '@/app/lib/api';
import Modal from 'react-modal';
import { TrashIcon } from '@heroicons/react/solid';

interface Exercise {
    equipment_name: string;
    sets: number;
    reps: number;
    weight: number;
}

interface Log {
    id: number;
    user_id: number;
    routine_id: number;
    used_at: string; // ISO 문자열 형식
    routine_name: string;
    routine_description: string;
    exercises: Exercise[];
}

export default function LogsPage() {
    useEffect(() => {
        const rootElement = document.querySelector('#__next') as HTMLElement;
        Modal.setAppElement(rootElement);
    }, []);

    const [logs, setLogs] = useState<Log[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [logToDelete, setLogToDelete] = useState<Log | null>(null);

    const limit = 10;

    const fetchLogs = async (page: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axiosInstance.get(`${SAPIBase}/logs`, {
                params: { page, limit },
            });
            console.log('로그 데이터:', response.data); // 디버깅용 로그
            setLogs(response.data.data);
            setCurrentPage(response.data.currentPage);
            setTotalPages(response.data.totalPages);
        } catch (err: any) {
            console.error('로그 가져오기 에러:', err); // 에러 로그 추가
            setError(err.response?.data?.error || '로그 목록을 가져오는 데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(currentPage);
    }, [currentPage]);

    const openDeleteModal = (log: Log) => {
        setLogToDelete(log);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setLogToDelete(null);
    };

    const handleDeleteLog = async () => {
        if (!logToDelete) return;

        try {
            await axiosInstance.delete(`${SAPIBase}/logs/${logToDelete.id}`);
            alert('로그가 성공적으로 삭제되었습니다.');
            closeDeleteModal();
            // 삭제 후 현재 페이지 다시 불러오기
            fetchLogs(currentPage);
        } catch (err: any) {
            console.error('로그 삭제 에러:', err);
            alert(err.response?.data?.error || '로그 삭제에 실패했습니다.');
        }
    };

    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-black p-4">
            {/* Hero Section */}
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
            <h1 className="text-3xl font-bold my-8">사용 로그</h1>
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <p>Loading...</p>
                </div>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : (
                <div className="w-full max-w-4xl">
                    {/* 로그 목록 */}
                    <div className="bg-white p-4 rounded-lg shadow overflow-x-auto">
                        <table className="min-w-full table-auto">
                            <thead>
                                <tr>
                                    <th className="px-4 py-2 border whitespace-nowrap">루틴 이름</th>
                                    <th className="px-4 py-2 border whitespace-nowrap">루틴 설명</th>
                                    <th className="px-4 py-2 border whitespace-nowrap">운동 내용</th>
                                    <th className="px-4 py-2 border whitespace-normal">사용 시간</th>
                                    <th className="px-4 py-2 border whitespace-nowrap">삭제</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-200">
                                        <td className="px-4 py-2 border whitespace-nowrap">{log.routine_name}</td>
                                        <td className="px-4 py-2 border whitespace-nowrap">{log.routine_description}</td>
                                        <td className="px-4 py-2 border">
                                            <ul className="list-disc pl-5">
                                                {log.exercises.map((exercise, index) => (
                                                    <li key={index} className="mb-1 break-words">
                                                        <span className="font-semibold">
                                                            {exercise.equipment_name} - {exercise.sets}세트 X {exercise.reps}회 @ {exercise.weight}kg
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </td>
                                        <td className="px-4 py-2 border text-center whitespace-normal">
                                            {new Date(log.used_at).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-2 border text-center whitespace-nowrap">
                                            <button
                                                onClick={() => openDeleteModal(log)}
                                                className="text-red-500 hover:text-red-700"
                                                aria-label={`로그 삭제 ${log.id}`}
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* 페이지 네비게이션 */}
                        <div className="flex justify-center mt-4 space-x-2">
                            {Array.from({ length: totalPages }, (_, index) => (
                                <button
                                    key={index + 1}
                                    className={`px-3 py-1 rounded ${
                                        currentPage === index + 1
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-200 text-black'
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

            {/* 삭제 확인 모달 */}
            <Modal
                isOpen={isDeleteModalOpen}
                onRequestClose={closeDeleteModal}
                contentLabel="로그 삭제 확인"
                className="modal"
                overlayClassName="overlay"
                ariaHideApp={false}
            >
                {logToDelete && (
                    <div className="p-4">
                        <h2 className="text-xl font-bold mb-4 text-black">로그 삭제</h2>
                        <p className="mb-4">정말로 이 로그를 삭제하시겠습니까?</p>
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={handleDeleteLog}
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700"
                            >
                                삭제
                            </button>
                            <button
                                onClick={closeDeleteModal}
                                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-700"
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
                    max-width: 400px;
                    width: 100%;
                    z-index: 1050;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                }
                .overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0, 0, 0, 0.75);
                    z-index: 1040;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 8px;
                }
                th {
                    background-color: #f2f2f2;
                    text-align: left;
                }
                ul {
                    margin: 0;
                    padding-left: 1.25rem; /* pl-5 equivalent */
                }
            `}</style>
        </main>
    );
}
