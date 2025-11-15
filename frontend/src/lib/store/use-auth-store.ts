"use client";

import { create } from "zustand";
import type { ActiveOrganization, AuthenticatedUser } from "@/lib/models/user";
import { setActiveTenantId } from "@/lib/api/client";

interface AuthState {
  user?: AuthenticatedUser;
  organization?: ActiveOrganization;
  setAuth: (payload: { user: AuthenticatedUser; organization: ActiveOrganization }) => void;
  updateOrganization: (organization: ActiveOrganization) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: undefined,
  organization: undefined,
  setAuth: ({ user, organization }) => {
    setActiveTenantId(organization?.id ?? null);
    set({
      user: {
        ...user,
        activeOrganizationId: organization?.id ?? null,
      },
      organization,
    });
  },
  updateOrganization: (organization) => {
    setActiveTenantId(organization?.id ?? null);
    set((state) => ({
      user: state.user
        ? {
            ...state.user,
            activeOrganizationId: organization?.id ?? null,
          }
        : undefined,
      organization,
    }));
  },
  clearAuth: () => {
    setActiveTenantId(null);
    set({ user: undefined, organization: undefined });
  },
}));
