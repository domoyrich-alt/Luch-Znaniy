import React, { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "student" | "teacher" | "director" | "curator" | "cook";

export interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: UserRole;
  classId: string;
  className: string;
  avatarUrl?: string;
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
  };

  switch (role) {
    case "student":
      return basePermissions;
    case "teacher":
      return {
        ...basePermissions,
        canEditSchedule: true,
        canEditClassComposition: true,
        canManageEvents: true,
        canManageHomework: true,
        canEditGrades: true,
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
  login: (inviteCode: string, role: UserRole) => void;
  logout: () => void;
  updateUserProfile: (updates: { firstName?: string; lastName?: string }) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USERS: Record<string, User> = {
  "9A-X7B3": {
    id: "1",
    name: "Алексей Иванов",
    email: "alex@school.edu",
    role: "student",
    classId: "9A",
    className: "9А класс",
  },
  "TEACH-001": {
    id: "2",
    name: "Мария Петрова",
    email: "maria@school.edu",
    role: "teacher",
    classId: "9A",
    className: "9А класс",
  },
  "DIR-001": {
    id: "3",
    name: "Сергей Сидоров",
    email: "director@school.edu",
    role: "director",
    classId: "ALL",
    className: "Директор",
  },
  "CUR-001": {
    id: "4",
    name: "Елена Козлова",
    email: "curator@school.edu",
    role: "curator",
    classId: "ALL",
    className: "Куратор",
  },
  "COOK-001": {
    id: "5",
    name: "Наталья Повар",
    email: "cook@school.edu",
    role: "cook",
    classId: "KITCHEN",
    className: "Столовая",
  },
};

const defaultPermissions = getRolePermissions("student");

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (inviteCode: string, role: UserRole) => {
    const foundUser = MOCK_USERS[inviteCode];
    if (foundUser) {
      setUser({ ...foundUser, role });
    } else {
      setUser({
        id: Date.now().toString(),
        name: "Пользователь",
        email: "user@school.edu",
        role,
        classId: inviteCode.split("-")[0] || "9A",
        className: `${inviteCode.split("-")[0] || "9A"} класс`,
      });
    }
  };

  const logout = () => {
    setUser(null);
  };

  const updateUserProfile = (updates: { firstName?: string; lastName?: string }) => {
    if (user) {
      const updatedUser = {
        ...user,
        ...updates,
        name: updates.firstName && updates.lastName 
          ? `${updates.firstName} ${updates.lastName}` 
          : user.name,
      };
      setUser(updatedUser);
    }
  };

  const permissions = user ? getRolePermissions(user.role) : defaultPermissions;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        permissions,
        login,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
