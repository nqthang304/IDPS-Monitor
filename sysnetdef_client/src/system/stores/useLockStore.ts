import { create } from 'zustand';

interface LockState {
  isLocked: boolean;
  currentAction: string | null; // Thêm biến lưu tên tiến trình (actionID)
  setLocked: (locked: boolean, action?: string | null) => void; // Thêm param action
}

export const useLockStore = create<LockState>((set) => ({
  isLocked: false,
  currentAction: null,
  
  // Hàm cập nhật cả trạng thái khóa và tên tiến trình đang chạy
  setLocked: (locked, action = null) => set({ 
    isLocked: locked, 
    // Nếu mở khóa (locked = false) thì tự động clear currentAction về null
    currentAction: locked ? action : null 
  }),
}));