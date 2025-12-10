import React, { createContext, useContext, useState, ReactNode } from "react";

export interface Attendance {
  date: string;
  status: "present" | "absent" | "late";
  markedAt?: string;
}

export interface Grade {
  id: string;
  subject: string;
  value: number;
  date: string;
  comment?: string;
}

export interface Homework {
  id: string;
  subject: string;
  title: string;
  description: string;
  deadline: string;
  attachments?: string[];
  status: "pending" | "submitted" | "graded";
  grade?: number;
}

export interface MenuItem {
  id: string;
  category: "first" | "main" | "salad" | "drink";
  name: string;
  rating: number;
  ratingCount: number;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  type: "school" | "class" | "optional";
  confirmed: boolean;
  participantCount: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
}

interface AppContextType {
  attendance: Attendance[];
  markAttendance: (status: "present" | "late") => void;
  todayAttendance: Attendance | null;
  grades: Grade[];
  homework: Homework[];
  menuItems: MenuItem[];
  rateMenuItem: (id: string, rating: number) => void;
  addMenuItem: (item: Omit<MenuItem, "id" | "rating" | "ratingCount">) => void;
  updateMenuItem: (id: string, item: Partial<MenuItem>) => void;
  deleteMenuItem: (id: string) => void;
  events: Event[];
  toggleEventConfirmation: (id: string) => void;
  addEvent: (event: Omit<Event, "id" | "confirmed" | "participantCount">) => void;
  updateEvent: (id: string, event: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  announcements: Announcement[];
  schedule: ScheduleItem[];
  addScheduleItem: (item: Omit<ScheduleItem, "id">) => void;
  updateScheduleItem: (id: string, item: Partial<ScheduleItem>) => void;
  deleteScheduleItem: (id: string) => void;
  isEvenWeek: boolean;
  toggleWeekType: () => void;
}

export interface ScheduleItem {
  id: string;
  day: number;
  startTime: string;
  endTime: string;
  subject: string;
  room: string;
  teacher: string;
  isEvenWeek: boolean | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const MOCK_GRADES: Grade[] = [
  { id: "1", subject: "Математика", value: 5, date: "2024-12-09", comment: "Отлично" },
  { id: "2", subject: "Математика", value: 4, date: "2024-12-06" },
  { id: "3", subject: "Русский язык", value: 5, date: "2024-12-09" },
  { id: "4", subject: "Физика", value: 4, date: "2024-12-08" },
  { id: "5", subject: "История", value: 5, date: "2024-12-07" },
  { id: "6", subject: "Английский", value: 4, date: "2024-12-06" },
  { id: "7", subject: "Химия", value: 3, date: "2024-12-05" },
  { id: "8", subject: "Биология", value: 5, date: "2024-12-04" },
];

const MOCK_HOMEWORK: Homework[] = [
  {
    id: "1",
    subject: "Математика",
    title: "Решить уравнения",
    description: "Упражнения 1-10, стр. 45",
    deadline: "2024-12-12",
    status: "pending",
  },
  {
    id: "2",
    subject: "Русский язык",
    title: "Сочинение",
    description: "Написать сочинение на тему 'Моя семья'",
    deadline: "2024-12-13",
    status: "pending",
  },
  {
    id: "3",
    subject: "Физика",
    title: "Лабораторная работа",
    description: "Выполнить лабораторную работу №5",
    deadline: "2024-12-11",
    status: "submitted",
  },
];

const MOCK_MENU: MenuItem[] = [
  { id: "1", category: "first", name: "Борщ со сметаной", rating: 4.2, ratingCount: 45 },
  { id: "2", category: "main", name: "Котлета с пюре", rating: 4.5, ratingCount: 52 },
  { id: "3", category: "salad", name: "Салат витаминный", rating: 3.8, ratingCount: 38 },
  { id: "4", category: "drink", name: "Компот из сухофруктов", rating: 4.0, ratingCount: 41 },
];

const MOCK_EVENTS: Event[] = [
  {
    id: "1",
    title: "Новогодний концерт",
    description: "Праздничное представление для учеников и родителей",
    date: "2024-12-25",
    type: "school",
    confirmed: false,
    participantCount: 156,
  },
  {
    id: "2",
    title: "Классный час",
    description: "Обсуждение итогов четверти",
    date: "2024-12-15",
    type: "class",
    confirmed: true,
    participantCount: 28,
  },
  {
    id: "3",
    title: "Олимпиада по математике",
    description: "Школьный этап олимпиады",
    date: "2024-12-18",
    type: "optional",
    confirmed: false,
    participantCount: 34,
  },
];

const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "1",
    title: "Каникулы",
    content: "Зимние каникулы с 28 декабря по 8 января",
    date: "2024-12-10",
    author: "Администрация",
  },
  {
    id: "2",
    title: "Родительское собрание",
    content: "Приглашаем родителей на собрание 20 декабря в 18:00",
    date: "2024-12-09",
    author: "Классный руководитель",
  },
];

const MOCK_SCHEDULE: ScheduleItem[] = [
  { id: "1", day: 1, startTime: "08:30", endTime: "09:15", subject: "Математика", room: "201", teacher: "Иванова А.П.", isEvenWeek: null },
  { id: "2", day: 1, startTime: "09:25", endTime: "10:10", subject: "Русский язык", room: "305", teacher: "Петрова М.И.", isEvenWeek: null },
  { id: "3", day: 1, startTime: "10:30", endTime: "11:15", subject: "Физика", room: "402", teacher: "Сидоров К.В.", isEvenWeek: null },
  { id: "4", day: 1, startTime: "11:25", endTime: "12:10", subject: "История", room: "203", teacher: "Козлова Е.А.", isEvenWeek: null },
  { id: "5", day: 1, startTime: "12:30", endTime: "13:15", subject: "Английский", room: "108", teacher: "Смирнова Л.Н.", isEvenWeek: true },
  { id: "6", day: 1, startTime: "12:30", endTime: "13:15", subject: "Информатика", room: "301", teacher: "Кузнецов Д.С.", isEvenWeek: false },
  { id: "7", day: 2, startTime: "08:30", endTime: "09:15", subject: "Химия", room: "401", teacher: "Волкова Н.П.", isEvenWeek: null },
  { id: "8", day: 2, startTime: "09:25", endTime: "10:10", subject: "Биология", room: "403", teacher: "Морозова О.В.", isEvenWeek: null },
  { id: "9", day: 2, startTime: "10:30", endTime: "11:15", subject: "География", room: "204", teacher: "Новиков П.А.", isEvenWeek: null },
  { id: "10", day: 2, startTime: "11:25", endTime: "12:10", subject: "Литература", room: "305", teacher: "Петрова М.И.", isEvenWeek: null },
  { id: "11", day: 3, startTime: "08:30", endTime: "09:15", subject: "Алгебра", room: "201", teacher: "Иванова А.П.", isEvenWeek: null },
  { id: "12", day: 3, startTime: "09:25", endTime: "10:10", subject: "Геометрия", room: "201", teacher: "Иванова А.П.", isEvenWeek: null },
  { id: "13", day: 3, startTime: "10:30", endTime: "11:15", subject: "Физкультура", room: "Спортзал", teacher: "Соколов В.М.", isEvenWeek: null },
  { id: "14", day: 3, startTime: "11:25", endTime: "12:10", subject: "ОБЖ", room: "105", teacher: "Федоров А.И.", isEvenWeek: null },
  { id: "15", day: 4, startTime: "08:30", endTime: "09:15", subject: "Русский язык", room: "305", teacher: "Петрова М.И.", isEvenWeek: null },
  { id: "16", day: 4, startTime: "09:25", endTime: "10:10", subject: "Математика", room: "201", teacher: "Иванова А.П.", isEvenWeek: null },
  { id: "17", day: 4, startTime: "10:30", endTime: "11:15", subject: "Физика", room: "402", teacher: "Сидоров К.В.", isEvenWeek: null },
  { id: "18", day: 4, startTime: "11:25", endTime: "12:10", subject: "Обществознание", room: "203", teacher: "Козлова Е.А.", isEvenWeek: null },
  { id: "19", day: 5, startTime: "08:30", endTime: "09:15", subject: "Английский", room: "108", teacher: "Смирнова Л.Н.", isEvenWeek: null },
  { id: "20", day: 5, startTime: "09:25", endTime: "10:10", subject: "Химия", room: "401", teacher: "Волкова Н.П.", isEvenWeek: null },
  { id: "21", day: 5, startTime: "10:30", endTime: "11:15", subject: "Музыка", room: "102", teacher: "Белова Т.С.", isEvenWeek: true },
  { id: "22", day: 5, startTime: "10:30", endTime: "11:15", subject: "ИЗО", room: "103", teacher: "Орлова И.К.", isEvenWeek: false },
  { id: "23", day: 6, startTime: "08:30", endTime: "09:15", subject: "Литература", room: "305", teacher: "Петрова М.И.", isEvenWeek: null },
  { id: "24", day: 6, startTime: "09:25", endTime: "10:10", subject: "История", room: "203", teacher: "Козлова Е.А.", isEvenWeek: null },
  { id: "25", day: 6, startTime: "10:30", endTime: "11:15", subject: "Технология", room: "Мастерская", teacher: "Павлов Г.Р.", isEvenWeek: null },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(MOCK_MENU);
  const [events, setEvents] = useState<Event[]>(MOCK_EVENTS);
  const [schedule, setSchedule] = useState<ScheduleItem[]>(MOCK_SCHEDULE);
  const [isEvenWeek, setIsEvenWeek] = useState(true);

  const today = new Date().toISOString().split("T")[0];
  const todayAttendance = attendance.find((a) => a.date === today) || null;

  const markAttendance = (status: "present" | "late") => {
    const now = new Date();
    const newAttendance: Attendance = {
      date: today,
      status,
      markedAt: now.toISOString(),
    };
    setAttendance((prev) => [...prev.filter((a) => a.date !== today), newAttendance]);
  };

  const rateMenuItem = (id: string, rating: number) => {
    setMenuItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              rating: (item.rating * item.ratingCount + rating) / (item.ratingCount + 1),
              ratingCount: item.ratingCount + 1,
            }
          : item
      )
    );
  };

  const addMenuItem = (item: Omit<MenuItem, "id" | "rating" | "ratingCount">) => {
    const newItem: MenuItem = {
      ...item,
      id: Date.now().toString(),
      rating: 0,
      ratingCount: 0,
    };
    setMenuItems((prev) => [...prev, newItem]);
  };

  const updateMenuItem = (id: string, updates: Partial<MenuItem>) => {
    setMenuItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const deleteMenuItem = (id: string) => {
    setMenuItems((prev) => prev.filter((item) => item.id !== id));
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

  const addEvent = (event: Omit<Event, "id" | "confirmed" | "participantCount">) => {
    const newEvent: Event = {
      ...event,
      id: Date.now().toString(),
      confirmed: false,
      participantCount: 0,
    };
    setEvents((prev) => [...prev, newEvent]);
  };

  const updateEvent = (id: string, updates: Partial<Event>) => {
    setEvents((prev) =>
      prev.map((event) => (event.id === id ? { ...event, ...updates } : event))
    );
  };

  const deleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((event) => event.id !== id));
  };

  const addScheduleItem = (item: Omit<ScheduleItem, "id">) => {
    const newItem: ScheduleItem = {
      ...item,
      id: Date.now().toString(),
    };
    setSchedule((prev) => [...prev, newItem]);
  };

  const updateScheduleItem = (id: string, updates: Partial<ScheduleItem>) => {
    setSchedule((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const deleteScheduleItem = (id: string) => {
    setSchedule((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleWeekType = () => {
    setIsEvenWeek((prev) => !prev);
  };

  return (
    <AppContext.Provider
      value={{
        attendance,
        markAttendance,
        todayAttendance,
        grades: MOCK_GRADES,
        homework: MOCK_HOMEWORK,
        menuItems,
        rateMenuItem,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        events,
        toggleEventConfirmation,
        addEvent,
        updateEvent,
        deleteEvent,
        announcements: MOCK_ANNOUNCEMENTS,
        schedule,
        addScheduleItem,
        updateScheduleItem,
        deleteScheduleItem,
        isEvenWeek,
        toggleWeekType,
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
