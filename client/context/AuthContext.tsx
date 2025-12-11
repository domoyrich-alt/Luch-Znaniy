import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiUrl } from "@/lib/query-client";

export type UserRole = "student" | "teacher" | "director" | "curator" | "cook" | "ceo" | "parent";

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  name: string;
  role: UserRole;
  classId: number | null;
  className: string;
  parentOfId?: number | null;
}

export interface Permissions {
  canEditSchedule: boolean;
  canEditClassComposition: boolean;
  canEditCafeteriaMenu: boolean;
  canManageEvents: boolean;
  canManageAnnouncements: boolean;
  canManageHomework: boolean;
  canViewGrades: boolean;
  canEditGrades: boolean;
  canCreateInviteCodes: boolean;
  canManageUsers: boolean;
}

function getRolePermissions(role: UserRole): Permissions {
  const basePermissions: Permissions = {
    canEditSchedule: false,
    canEditClassComposition: false,
    canEditCafeteriaMenu: false,
    canManageEvents: false,
    canManageAnnouncements: false,
    canManageHomework: false,
    canViewGrades: true,
    canEditGrades: false,
    canCreateInviteCodes: false,
    canManageUsers: false,
  };

  switch (role) {
    case "student":
      return basePermissions;
    case "parent":
      return {
        ...basePermissions,
        canViewGrades: true,
      };
    case "teacher":
      return {
        ...basePermissions,
        canEditSchedule: true,
        canEditClassComposition: true,
        canManageEvents: true,
        canManageHomework: true,
        canEditGrades: true,
        canCreateInviteCodes: true,
      };
    case "curator":
      return {
        ...basePermissions,
        canEditSchedule: true,
        canEditClassComposition: true,
        canManageEvents: true,
        canManageAnnouncements: true,
        canManageHomework: true,
        canEditGrades: true,
        canCreateInviteCodes: true,
      };
    case "director":
      return {
        canEditSchedule: true,
        canEditClassComposition: true,
        canEditCafeteriaMenu: true,
        canManageEvents: true,
        canManageAnnouncements: true,
        canManageHomework: true,
        canViewGrades: true,
        canEditGrades: true,
        canCreateInviteCodes: true,
        canManageUsers: true,
      };
    case "ceo":
      return {
        canEditSchedule: true,
        canEditClassComposition: true,
        canEditCafeteriaMenu: true,
        canManageEvents: true,
        canManageAnnouncements: true,
        canManageHomework: true,
        canViewGrades: true,
        canEditGrades: true,
        canCreateInviteCodes: true,
        canManageUsers: true,
      };
    case "cook":
      return {
        ...basePermissions,
        canEditCafeteriaMenu: true,
      };
    default:
      return basePermissions;
  }
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  permissions: Permissions;
  isLoading: boolean;
  error: string | null;
  login: (inviteCode: string, role: UserRole, firstName?: string, lastName?: string) => Promise<void>;
  logout: () => void;
  updateUserProfile: (updates: { firstName?: string; lastName?: string }) => void;
  verifyCode: (code: string) => Promise<{ valid: boolean; role?: string; className?: string; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultPermissions = getRolePermissions("student");
const USER_STORAGE_KEY = "luch_znaniy_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Failed to load user from storage:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async (code: string): Promise<{ valid: boolean; role?: string; className?: string; error?: string }> => {
    try {
      const response = await fetch(new URL(`/api/verify-code/${code}`, getApiUrl()).toString());
      
      if (!response.ok) {
        const data = await response.json();
        return { valid: false, error: data.error || "Неверный код" };
      }
      
      const data = await response.json();
      return { valid: true, role: data.role, className: data.className };
    } catch (e) {
      console.error("Verify code error:", e);
      return { valid: false, error: "Ошибка проверки кода" };
    }
  };

  const login = async (inviteCode: string, role: UserRole, firstName?: string, lastName?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(new URL("/api/auth/login", getApiUrl()).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteCode,
          role,
          firstName: firstName || "Пользователь",
          lastName: lastName || "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Ошибка входа");
        return;
      }

      const newUser: User = {
        id: data.user.id,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        name: `${data.user.firstName} ${data.user.lastName}`.trim(),
        role: data.user.role,
        classId: data.user.classId,
        className: data.user.className || getRoleLabel(data.user.role),
      };

      setUser(newUser);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
    } catch (e) {
      console.error("Login error:", e);
      setError("Ошибка подключения к серверу");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
  };

  const updateUserProfile = async (updates: { firstName?: string; lastName?: string }) => {
    if (user) {
      const updatedUser = {
        ...user,
        firstName: updates.firstName || user.firstName,
        lastName: updates.lastName || user.lastName,
        name: `${updates.firstName || user.firstName} ${updates.lastName || user.lastName}`.trim(),
      };
      setUser(updatedUser);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
    }
  };

  const permissions = user ? getRolePermissions(user.role) : defaultPermissions;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        permissions,
        isLoading,
        error,
        login,
        logout,
        updateUserProfile,
        verifyCode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    student: "Ученик",
    teacher: "Учитель",
    director: "Директор",
    curator: "Куратор",
    cook: "Повар",
    ceo: "CEO",
    parent: "Родитель",
  };
  return labels[role] || role;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
