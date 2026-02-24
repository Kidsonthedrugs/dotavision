"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { User, UserSettings } from "@/types";

interface UIState {
  sidebarCollapsed: boolean;
  theme: "dark" | "light";
  searchOpen: boolean;
  selectedPlayerId: string | null;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

interface AppState extends UIState, AuthState {
  // UI Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: "dark" | "light") => void;
  toggleSearch: () => void;
  setSearchOpen: (open: boolean) => void;
  setSelectedPlayerId: (id: string | null) => void;
  // Auth Actions
  setUser: (user: User | null) => void;
  logout: () => void;
  // Settings Actions
  updateSettings: (settings: Partial<UserSettings>) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("dotavision-state");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.sidebarCollapsed !== undefined) {
            setSidebarCollapsed(parsed.sidebarCollapsed);
          }
          if (parsed.theme) {
            setTheme(parsed.theme);
          }
        } catch (e) {
          console.error("Failed to parse stored state:", e);
        }
      }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "dotavision-state",
        JSON.stringify({ sidebarCollapsed, theme, user })
      );
    }
  }, [sidebarCollapsed, theme, user]);

  const value: AppState = {
    sidebarCollapsed,
    theme,
    searchOpen,
    selectedPlayerId,
    user,
    isAuthenticated: !!user,
    toggleSidebar: () => setSidebarCollapsed((prev) => !prev),
    setSidebarCollapsed,
    setTheme,
    toggleSearch: () => setSearchOpen((prev) => !prev),
    setSearchOpen,
    setSelectedPlayerId,
    setUser,
    logout: () => setUser(null),
    updateSettings: (settings) => {
      if (user) {
        setUser({
          ...user,
          settings: { ...user.settings, ...settings } as UserSettings,
        });
      }
    },
  };

  return React.createElement(AppContext.Provider, { value }, children);
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppStore must be used within AppProvider");
  }
  return context;
}

// Selectors for optimized re-renders
export const selectIsAuthenticated = (state: AppState) => state.isAuthenticated;
export const selectUser = (state: AppState) => state.user;
export const selectTheme = (state: AppState) => state.theme;
export const selectSidebarCollapsed = (state: AppState) => state.sidebarCollapsed;
export const selectSearchOpen = (state: AppState) => state.searchOpen;
export const selectSelectedPlayerId = (state: AppState) => state.selectedPlayerId;
