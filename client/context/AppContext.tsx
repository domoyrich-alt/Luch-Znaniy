import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { getApiUrl, apiRequest } from "@/lib/query-client";
import { useAuth } from "./AuthContext";

export interface Attendance {
  date: string;
  status: "present" | "absent" | "late";
  markedAt?: string;
}

export interface Grade {
  id: string;
  subject: string;
  subjectId: number;
  value: number;
  date: string;
  comment?: string;
}

export interface Homework {
  id: string;
  subject: string;
  subjectId: number;
  title: string;
  description: string;
  deadline: string;
  attachments?: string[];
  status: "pending" | "submitted" | "graded";
  grade?: number;
}

export interface MenuItem {
  id: string;
  category: string;
  name: string;
  description?: string;
  price: number;
  isAvailable: boolean;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  location?: string;
  type: "school" | "class" | "optional" | "event";
  confirmed: boolean;
  participantCount: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  isImportant: boolean;
}

export interface ScheduleItem {
  id: string;
  day: number;
  startTime: string;
  endTime: string;
  subject: string;
  subjectId: number;
  room: string;
  teacher: string;
  isEvenWeek: boolean | null;
}

export interface Subject {
  id: number;
  name: string;
}

export interface ClassStudent {
  id: number;
  name: string;
  status: "present" | "late" | "absent";
}

interface AppContextType {
  attendance: Attendance[];
  markAttendance: (status: "present" | "late") => Promise<void>;
  markStudentAttendance: (studentId: number, status: "present" | "late" | "absent") => Promise<void>;
  markAllStudentsPresent: () => Promise<void>;
  todayAttendance: Attendance | null;
  classStudents: ClassStudent[];
  attendanceStats: { total: number; present: number; late: number; absent: number };
  grades: Grade[];
  averageGrade: number;
  homework: Homework[];
  submitHomework: (id: string, content?: string, photoUrl?: string) => Promise<void>;
  addHomework: (homework: { subjectId: number; title: string; description: string; dueDate: string }) => Promise<void>;
  menuItems: MenuItem[];
  addMenuItem: (item: Omit<MenuItem, "id">) => Promise<void>;
  updateMenuItem: (id: string, item: Partial<MenuItem>) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;
  events: Event[];
  toggleEventConfirmation: (id: string) => void;
  addEvent: (event: Omit<Event, "id" | "confirmed" | "participantCount">) => Promise<void>;
  updateEvent: (id: string, event: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  announcements: Announcement[];
  addAnnouncement: (announcement: Omit<Announcement, "id" | "date" | "author">) => Promise<void>;
  schedule: ScheduleItem[];
  addScheduleItem: (item: Omit<ScheduleItem, "id">) => Promise<void>;
  updateScheduleItem: (id: string, item: Partial<ScheduleItem>) => Promise<void>;
  deleteScheduleItem: (id: string) => Promise<void>;
  isEvenWeek: boolean;
  toggleWeekType: () => void;
  subjects: Subject[];
  refreshData: () => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [classStudents, setClassStudents] = useState<ClassStudent[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [averageGrade, setAverageGrade] = useState(0);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isEvenWeek, setIsEvenWeek] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const todayAttendance = attendance.find((a) => a.date === today) || null;

  const attendanceStats = {
    total: classStudents.length || 42,
    present: classStudents.filter(s => s.status === "present").length || 40,
    late: classStudents.filter(s => s.status === "late").length || 2,
    absent: classStudents.filter(s => s.status === "absent").length || 0,
  };

  const fetchCafeteriaMenu = useCallback(async () => {
    try {
      const response = await fetch(new URL("/api/cafeteria", getApiUrl()).toString());
      if (response.ok) {
        const data = await response.json();
        setMenuItems(data.map((item: any) => ({
          id: item.id.toString(),
          category: item.category,
          name: item.name,
          description: item.description || "",
          price: parseFloat(item.price) || 0,
          isAvailable: item.isAvailable !== false,
        })));
      }
    } catch (e) {
      console.error("Failed to fetch cafeteria menu:", e);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      const url = new URL("/api/events", getApiUrl());
      if (user?.classId) {
        url.searchParams.set("classId", user.classId.toString());
      }
      const response = await fetch(url.toString());
      if (response.ok) {
        const data = await response.json();
        setEvents(data.map((event: any) => ({
          id: event.id.toString(),
          title: event.title,
          description: event.description || "",
          date: event.date,
          time: event.time,
          location: event.location,
          type: event.type || "event",
          confirmed: false,
          participantCount: 0,
        })));
      }
    } catch (e) {
      console.error("Failed to fetch events:", e);
    }
  }, [user?.classId]);

  const fetchNews = useCallback(async () => {
    try {
      const response = await fetch(new URL("/api/news", getApiUrl()).toString());
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data.map((item: any) => ({
          id: item.id.toString(),
          title: item.title,
          content: item.content,
          date: item.createdAt?.split("T")[0] || new Date().toISOString().split("T")[0],
          author: "Администрация",
          isImportant: item.isImportant,
        })));
      }
    } catch (e) {
      console.error("Failed to fetch news:", e);
    }
  }, []);

  const fetchGrades = useCallback(async () => {
    if (!user?.id || user.role !== "student") return;
    try {
      const response = await fetch(new URL(`/api/grades/${user.id}`, getApiUrl()).toString());
      if (response.ok) {
        const data = await response.json();
        setAverageGrade(data.averageGrade || 0);
        setGrades(data.grades?.map((grade: any) => ({
          id: grade.id.toString(),
          subject: grade.subjectName || "Предмет",
          subjectId: grade.subjectId,
          value: grade.grade,
          date: grade.date,
          comment: grade.comment,
        })) || []);
      }
    } catch (e) {
      console.error("Failed to fetch grades:", e);
    }
  }, [user?.id, user?.role]);

  const fetchHomework = useCallback(async () => {
    try {
      const classIdToFetch = user?.classId || 11;
      const response = await fetch(new URL(`/api/homework/${classIdToFetch}`, getApiUrl()).toString());
      if (response.ok) {
        const data = await response.json();
        setHomework(data.map((hw: any) => ({
          id: hw.id.toString(),
          subject: hw.subjectName || "Предмет",
          subjectId: hw.subjectId,
          title: hw.title,
          description: hw.description || "",
          deadline: hw.dueDate,
          status: "pending",
        })));
      }
    } catch (e) {
      console.error("Failed to fetch homework:", e);
    }
  }, [user?.classId]);

  const fetchSchedule = useCallback(async () => {
    if (!user?.classId) return;
    try {
      const response = await fetch(new URL(`/api/schedule/${user.classId}`, getApiUrl()).toString());
      if (response.ok) {
        const data = await response.json();
        setSchedule(data.map((item: any) => ({
          id: item.id.toString(),
          day: item.dayOfWeek,
          startTime: item.startTime,
          endTime: item.endTime,
          subject: item.subjectName || "Предмет",
          subjectId: item.subjectId,
          room: item.room || "",
          teacher: item.teacherName || "",
          isEvenWeek: item.isEvenWeek,
        })));
      }
    } catch (e) {
      console.error("Failed to fetch schedule:", e);
    }
  }, [user?.classId]);

  const fetchSubjects = useCallback(async () => {
    try {
      const classIdToFetch = user?.classId || 11;
      const response = await fetch(new URL(`/api/subjects/${classIdToFetch}`, getApiUrl()).toString());
      if (response.ok) {
        const data = await response.json();
        setSubjects(data);
      }
    } catch (e) {
      console.error("Failed to fetch subjects:", e);
    }
  }, [user?.classId]);

  const refreshData = useCallback(() => {
    setIsLoading(true);
    Promise.all([
      fetchCafeteriaMenu(),
      fetchEvents(),
      fetchNews(),
      fetchGrades(),
      fetchHomework(),
      fetchSchedule(),
      fetchSubjects(),
    ]).finally(() => setIsLoading(false));
  }, [fetchCafeteriaMenu, fetchEvents, fetchNews, fetchGrades, fetchHomework, fetchSchedule, fetchSubjects]);

  const addHomework = async (hw: { subjectId: number; title: string; description: string; dueDate: string }) => {
    try {
      const classIdToUse = user?.classId || 11;
      const response = await apiRequest("POST", "/api/homework", {
        classId: classIdToUse,
        subjectId: hw.subjectId,
        title: hw.title,
        description: hw.description,
        dueDate: hw.dueDate,
        createdById: user?.id,
      });
      const newItem = await response.json();
      const subject = subjects.find(s => s.id === hw.subjectId);
      setHomework((prev) => [...prev, {
        id: newItem.id.toString(),
        subject: subject?.name || "Предмет",
        subjectId: hw.subjectId,
        title: hw.title,
        description: hw.description,
        deadline: hw.dueDate,
        status: "pending",
      }]);
    } catch (e) {
      console.error("Failed to add homework:", e);
      throw e;
    }
  };

  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [user, refreshData]);

  const fetchAttendance = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(new URL(`/api/attendance/${user.id}`, getApiUrl()).toString());
      if (response.ok) {
        const data = await response.json();
        setAttendance(data.map((a: any) => ({
          date: a.date,
          status: a.status,
          markedAt: a.markedAt || a.createdAt,
        })));
      }
    } catch (e) {
      console.error("Failed to fetch attendance:", e);
    }
  }, [user?.id]);

  const fetchClassStudents = useCallback(async () => {
    if (!user?.classId || user.role === "student") return;
    try {
      const response = await fetch(new URL(`/api/class/${user.classId}/students`, getApiUrl()).toString());
      if (response.ok) {
        const data = await response.json();
        setClassStudents(data.map((s: any) => ({
          id: s.id,
          name: s.name,
          status: s.todayStatus || "absent",
        })));
      }
    } catch (e) {
      console.error("Failed to fetch class students:", e);
    }
  }, [user?.classId, user?.role]);

  const markAttendance = async (status: "present" | "late") => {
    if (!user?.id) return;
    const now = new Date();
    try {
      await apiRequest("POST", "/api/attendance", {
        studentId: user.id,
        date: today,
        status,
        markedAt: now.toISOString(),
      });
      const newAttendance: Attendance = {
        date: today,
        status,
        markedAt: now.toISOString(),
      };
      setAttendance((prev) => [...prev.filter((a) => a.date !== today), newAttendance]);
    } catch (e) {
      console.error("Failed to mark attendance:", e);
      const newAttendance: Attendance = {
        date: today,
        status,
        markedAt: now.toISOString(),
      };
      setAttendance((prev) => [...prev.filter((a) => a.date !== today), newAttendance]);
    }
  };

  const markStudentAttendance = async (studentId: number, status: "present" | "late" | "absent") => {
    try {
      await apiRequest("POST", "/api/attendance", {
        studentId,
        date: today,
        status,
        markedAt: new Date().toISOString(),
      });
      setClassStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, status } : s))
      );
    } catch (e) {
      console.error("Failed to mark student attendance:", e);
      setClassStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, status } : s))
      );
    }
  };

  const markAllStudentsPresent = async () => {
    const promises = classStudents.map((s) =>
      apiRequest("POST", "/api/attendance", {
        studentId: s.id,
        date: today,
        status: "present",
        markedAt: new Date().toISOString(),
      }).catch(() => {})
    );
    await Promise.all(promises);
    setClassStudents((prev) => prev.map((s) => ({ ...s, status: "present" })));
  };

  const addMenuItem = async (item: Omit<MenuItem, "id">) => {
    try {
      const payload = {
        name: item.name,
        category: item.category,
        description: item.description || "",
        price: (item.price || 0).toString(),
        isAvailable: item.isAvailable !== false,
      };
      const response = await apiRequest("POST", "/api/cafeteria", payload);
      const newItem = await response.json();
      setMenuItems((prev) => [...prev, {
        id: newItem.id.toString(),
        category: newItem.category,
        name: newItem.name,
        description: newItem.description,
        price: parseFloat(newItem.price) || 0,
        isAvailable: newItem.isAvailable !== false,
      }]);
    } catch (e) {
      console.error("Failed to add menu item:", e);
    }
  };

  const updateMenuItem = async (id: string, updates: Partial<MenuItem>) => {
    try {
      const payload: any = { ...updates };
      if (payload.price !== undefined) {
        payload.price = payload.price.toString();
      }
      await apiRequest("PUT", `/api/cafeteria/${id}`, payload);
      setMenuItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );
    } catch (e) {
      console.error("Failed to update menu item:", e);
    }
  };

  const deleteMenuItem = async (id: string) => {
    try {
      await apiRequest("DELETE", `/api/cafeteria/${id}`);
      setMenuItems((prev) => prev.filter((item) => item.id !== id));
    } catch (e) {
      console.error("Failed to delete menu item:", e);
    }
  };

  const toggleEventConfirmation = (id: string) => {
    setEvents((prev) =>
      prev.map((event) =>
        event.id === id
          ? {
              ...event,
              confirmed: !event.confirmed,
              participantCount: event.confirmed
                ? event.participantCount - 1
                : event.participantCount + 1,
            }
          : event
      )
    );
  };

  const addEvent = async (event: Omit<Event, "id" | "confirmed" | "participantCount">) => {
    try {
      const response = await apiRequest("POST", "/api/events", {
        ...event,
        classId: user?.classId,
        createdById: user?.id,
      });
      const newEvent = await response.json();
      setEvents((prev) => [...prev, {
        id: newEvent.id.toString(),
        title: newEvent.title,
        description: newEvent.description || "",
        date: newEvent.date,
        time: newEvent.time,
        location: newEvent.location,
        type: newEvent.type || "event",
        confirmed: false,
        participantCount: 0,
      }]);
    } catch (e) {
      console.error("Failed to add event:", e);
    }
  };

  const updateEvent = async (id: string, updates: Partial<Event>) => {
    try {
      await apiRequest("PUT", `/api/events/${id}`, updates);
      setEvents((prev) =>
        prev.map((event) => (event.id === id ? { ...event, ...updates } : event))
      );
    } catch (e) {
      console.error("Failed to update event:", e);
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      await apiRequest("DELETE", `/api/events/${id}`);
      setEvents((prev) => prev.filter((event) => event.id !== id));
    } catch (e) {
      console.error("Failed to delete event:", e);
    }
  };

  const addAnnouncement = async (announcement: Omit<Announcement, "id" | "date" | "author">) => {
    try {
      const response = await apiRequest("POST", "/api/news", {
        ...announcement,
        createdById: user?.id,
      });
      const newItem = await response.json();
      setAnnouncements((prev) => [...prev, {
        id: newItem.id.toString(),
        title: newItem.title,
        content: newItem.content,
        date: new Date().toISOString().split("T")[0],
        author: user?.name || "Администрация",
        isImportant: newItem.isImportant,
      }]);
    } catch (e) {
      console.error("Failed to add announcement:", e);
    }
  };

  const addScheduleItem = async (item: Omit<ScheduleItem, "id">) => {
    try {
      const response = await apiRequest("POST", "/api/schedule", {
        classId: user?.classId,
        subjectId: item.subjectId,
        teacherId: user?.id,
        dayOfWeek: item.day,
        startTime: item.startTime,
        endTime: item.endTime,
        room: item.room,
        isEvenWeek: item.isEvenWeek,
      });
      const newItem = await response.json();
      setSchedule((prev) => [...prev, {
        id: newItem.id.toString(),
        day: newItem.dayOfWeek,
        startTime: newItem.startTime,
        endTime: newItem.endTime,
        subject: item.subject,
        subjectId: newItem.subjectId,
        room: newItem.room || "",
        teacher: item.teacher,
        isEvenWeek: newItem.isEvenWeek,
      }]);
    } catch (e) {
      console.error("Failed to add schedule item:", e);
    }
  };

  const updateScheduleItem = async (id: string, updates: Partial<ScheduleItem>) => {
    try {
      await apiRequest("PUT", `/api/schedule/${id}`, {
        dayOfWeek: updates.day,
        startTime: updates.startTime,
        endTime: updates.endTime,
        room: updates.room,
        isEvenWeek: updates.isEvenWeek,
      });
      setSchedule((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );
    } catch (e) {
      console.error("Failed to update schedule item:", e);
    }
  };

  const deleteScheduleItem = async (id: string) => {
    try {
      await apiRequest("DELETE", `/api/schedule/${id}`);
      setSchedule((prev) => prev.filter((item) => item.id !== id));
    } catch (e) {
      console.error("Failed to delete schedule item:", e);
    }
  };

  const toggleWeekType = () => {
    setIsEvenWeek((prev) => !prev);
  };

  const submitHomework = async (id: string, content?: string, photoUrl?: string) => {
    try {
      await apiRequest("POST", `/api/homework/${id}/submit`, {
        studentId: user?.id,
        content,
        photoUrl,
      });
      setHomework((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: "submitted" as const } : item
        )
      );
    } catch (e) {
      console.error("Failed to submit homework:", e);
    }
  };

  return (
    <AppContext.Provider
      value={{
        attendance,
        markAttendance,
        markStudentAttendance,
        markAllStudentsPresent,
        todayAttendance,
        classStudents,
        attendanceStats,
        grades,
        averageGrade,
        homework,
        submitHomework,
        addHomework,
        menuItems,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        events,
        toggleEventConfirmation,
        addEvent,
        updateEvent,
        deleteEvent,
        announcements,
        addAnnouncement,
        schedule,
        addScheduleItem,
        updateScheduleItem,
        deleteScheduleItem,
        isEvenWeek,
        toggleWeekType,
        subjects,
        refreshData,
        isLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
