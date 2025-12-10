import React, { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "student" | "teacher" | "director" | "curator";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  classId: string;
  className: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (inviteCode: string, role: UserRole) => void;
  logout: () => void;
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
};

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

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
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
