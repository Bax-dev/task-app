import { create } from 'zustand';

interface OrgState {
  currentOrgId: string | null;
  setCurrentOrg: (id: string) => void;
  clearCurrentOrg: () => void;
}

export const useOrgStore = create<OrgState>((set) => ({
  currentOrgId: null,
  setCurrentOrg: (id) => set({ currentOrgId: id }),
  clearCurrentOrg: () => set({ currentOrgId: null }),
}));
