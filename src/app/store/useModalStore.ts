import { create } from "zustand";

interface ModalState {
  isOpen: boolean;
  projectType: string;
  openModal: (projectType?: string) => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isOpen: false,
  projectType: "",
  openModal: (projectType = "") => set({ isOpen: true, projectType }),
  closeModal: () => set({ isOpen: false, projectType: "" }),
}));
