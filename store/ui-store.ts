import { create } from "zustand";

interface UIState {
    sidebarCollapsed: boolean;
    commandOpen: boolean;
    commandQuery: string;
    toggleSidebar: () => void;
    setCommandOpen: (open: boolean) => void;
    setCommandQuery: (query: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
    sidebarCollapsed: false,
    commandOpen: false,
    commandQuery: "",
    toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    setCommandOpen: (open) => set({ commandOpen: open }),
    setCommandQuery: (query) => set({ commandQuery: query }),
}));
