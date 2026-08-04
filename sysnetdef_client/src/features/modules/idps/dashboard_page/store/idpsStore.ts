import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { IDPSStats, IDPSPacket, IdpsMode, IDPSDashboardData } from '@/features/types/idps.type';

// 1. Thêm hàm tiện ích tạo ID ngẫu nhiên (nếu IDPSPacket chưa có ID từ backend)
const generateId = () => {
    return typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Mở rộng interface để chứa thêm _id
export interface ExtendedIDPSPacket extends IDPSPacket {
    _id?: string;
}

interface IdpsState {
    isActive: boolean;
    mode: IdpsMode;
    summary: IDPSStats;
    percentages: {
        malwareAlertPct: number;
        malwareDropPct: number;
    };
    onsecHistory: (IDPSStats & { time: number })[];
    logs: ExtendedIDPSPacket[]; // Đổi sang dùng type mở rộng có _id
    setStatus: (active: boolean, mode: IdpsMode) => void;
    updateIdpsData: (data: IDPSDashboardData) => void;
    updateLogs: (newLogs: IDPSPacket[]) => void;
    resetStats: () => void;
}

const HISTORY_POINTS = 300;
const initialHistoryTemplate = Array(HISTORY_POINTS).fill(null).map(() => ({
    time: 0,
    normal: 0,
    alert: 0,
    drop: 0,
    malware: 0,
    malwareAlert: 0,
    malwareDrop: 0,
    totalPackets: 0,
    totalBytes: 0,
}));

export const useIdpsStore = create<IdpsState>()(
    persist(
        (set) => ({
            isActive: false,
            mode: 'ids',
            summary: { normal: 0, alert: 0, drop: 0, malware: 0, malwareAlert: 0, malwareDrop: 0, totalPackets: 0, totalBytes: 0 },
            percentages: { malwareAlertPct: 0, malwareDropPct: 0 },
            onsecHistory: initialHistoryTemplate, 
            logs: [],

            setStatus: (active, mode) => set({ isActive: active, mode }),

            updateIdpsData: (data) => set((state) => {
                if (!state.isActive || !data || !data.onsec) return state;
                const newPoint = { ...data.onsec, time: data.serverTimestamp || Date.now() };
                const updatedHistory = [...state.onsecHistory.slice(1), newPoint];

                return {
                    summary: data.summary || state.summary,
                    percentages: data.percentages || state.percentages,
                    onsecHistory: updatedHistory,
                };
            }),

            // 2. CẬP NHẬT updateLogs ĐỂ GẮN ID
            updateLogs: (newLogs) => set((state) => {
                if (!state.isActive || !newLogs || newLogs.length === 0) return state;
                const logsWithId = newLogs.map(log => ({
                    ...log,
                    _id: generateId() // Gắn key cố định
                }));
                const mergedLogs = [...logsWithId, ...state.logs].slice(0, 100);
                return { logs: mergedLogs };
            }),

            resetStats: () => set({
                summary: { normal: 0, alert: 0, drop: 0, malware: 0, malwareAlert: 0, malwareDrop: 0, totalPackets: 0, totalBytes: 0 },
                percentages: { malwareAlertPct: 0, malwareDropPct: 0 },
                onsecHistory: initialHistoryTemplate,
                logs: []
            }),
        }),
        {
            name: 'idps-dashboard-storage-v4', // Tăng version lên v4 để clear cache cũ
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                isActive: state.isActive,
                mode: state.mode,
                summary: state.summary,
                percentages: state.percentages, 
                onsecHistory: state.onsecHistory, 
                logs: state.logs,                 
            }),
        }
    )
);