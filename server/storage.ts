import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";
import {
  users, classes, inviteCodes, subjects, grades, homework,
  homeworkSubmissions, scheduleItems, events, news, cafeteriaMenu,
  attendance, chatMessages,
  type User, type InsertUser,
  type Class, type InsertClass,
  type InviteCode, type InsertInviteCode,
  type Subject, type InsertSubject,
  type Grade, type InsertGrade,
  type Homework, type InsertHomework,
  type HomeworkSubmission, type InsertHomeworkSubmission,
  type ScheduleItem, type InsertScheduleItem,
  type Event, type InsertEvent,
  type News, type InsertNews,
  type CafeteriaMenuItem, type InsertCafeteriaMenuItem,
  type Attendance, type InsertAttendance,
  type ChatMessage, type InsertChatMessage,
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByInviteCode(code: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;
  
  getClass(id: number): Promise<Class | undefined>;
  getClassByInviteCode(code: string): Promise<Class | undefined>;
  getAllClasses(): Promise<Class[]>;
  createClass(classData: InsertClass): Promise<Class>;
  
  getInviteCode(code: string): Promise<InviteCode | undefined>;
  validateInviteCode(code: string, role: string): Promise<{ valid: boolean; classId?: number; className?: string; error?: string }>;
  getAllInviteCodes(): Promise<InviteCode[]>;
  createInviteCode(inviteCode: InsertInviteCode): Promise<InviteCode>;
  
  getSubject(id: number): Promise<Subject | undefined>;
  getSubjectsByClass(classId: number): Promise<Subject[]>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  
  getGradesByStudent(studentId: number): Promise<Grade[]>;
  getGradesByStudentAndSubject(studentId: number, subjectId: number): Promise<Grade[]>;
  getAverageGradeByStudent(studentId: number): Promise<number>;
  getAverageGradeBySubject(studentId: number, subjectId: number): Promise<number>;
  createGrade(grade: InsertGrade): Promise<Grade>;
  
  getHomeworkByClass(classId: number): Promise<Homework[]>;
  getHomework(id: number): Promise<Homework | undefined>;
  createHomework(homework: InsertHomework): Promise<Homework>;
  
  getHomeworkSubmission(homeworkId: number, studentId: number): Promise<HomeworkSubmission | undefined>;
  createHomeworkSubmission(submission: InsertHomeworkSubmission): Promise<HomeworkSubmission>;
  updateHomeworkSubmission(id: number, data: Partial<InsertHomeworkSubmission>): Promise<HomeworkSubmission | undefined>;
  
  getScheduleByClass(classId: number, isEvenWeek?: boolean): Promise<ScheduleItem[]>;
  createScheduleItem(item: InsertScheduleItem): Promise<ScheduleItem>;
  updateScheduleItem(id: number, data: Partial<InsertScheduleItem>): Promise<ScheduleItem | undefined>;
  deleteScheduleItem(id: number): Promise<void>;
  
  getEvents(classId?: number): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, data: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<void>;
  
  getNews(): Promise<News[]>;
  getNewsItem(id: number): Promise<News | undefined>;
  createNews(newsItem: InsertNews): Promise<News>;
  updateNews(id: number, data: Partial<InsertNews>): Promise<News | undefined>;
  deleteNews(id: number): Promise<void>;
  
  getCafeteriaMenu(): Promise<CafeteriaMenuItem[]>;
  getCafeteriaMenuItem(id: number): Promise<CafeteriaMenuItem | undefined>;
  createCafeteriaMenuItem(item: InsertCafeteriaMenuItem): Promise<CafeteriaMenuItem>;
  updateCafeteriaMenuItem(id: number, data: Partial<InsertCafeteriaMenuItem>): Promise<CafeteriaMenuItem | undefined>;
  deleteCafeteriaMenuItem(id: number): Promise<void>;
  
  getAttendanceByStudent(studentId: number): Promise<Attendance[]>;
  getAttendanceByStudentAndDate(studentId: number, date: string): Promise<Attendance | undefined>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  
  getStudentsByClass(classId: number): Promise<User[]>;
  
  getChatMessages(homeworkId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByInviteCode(code: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.inviteCode, code));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updated;
  }

  async getClass(id: number): Promise<Class | undefined> {
    const [classData] = await db.select().from(classes).where(eq(classes.id, id));
    return classData;
  }

  async getClassByInviteCode(code: string): Promise<Class | undefined> {
    const [classData] = await db.select().from(classes).where(eq(classes.inviteCode, code));
    return classData;
  }

  async getAllClasses(): Promise<Class[]> {
    return db.select().from(classes).orderBy(classes.grade);
  }

  async createClass(classData: InsertClass): Promise<Class> {
    const [newClass] = await db.insert(classes).values(classData).returning();
    return newClass;
  }

  async getInviteCode(code: string): Promise<InviteCode | undefined> {
    const [inviteCode] = await db.select().from(inviteCodes).where(eq(inviteCodes.code, code));
    return inviteCode;
  }

  async validateInviteCode(code: string, role: string): Promise<{ valid: boolean; classId?: number; className?: string; error?: string }> {
    const inviteCode = await this.getInviteCode(code);
    
    if (!inviteCode) {
      return { valid: false, error: "Неверный код приглашения" };
    }
    
    if (!inviteCode.isActive) {
      return { valid: false, error: "Код приглашения деактивирован" };
    }
    
    if (inviteCode.role !== role) {
      return { valid: false, error: `Этот код предназначен для роли "${inviteCode.role}", а не "${role}"` };
    }
    
    if (role === "student" && inviteCode.classId) {
      const classData = await this.getClass(inviteCode.classId);
      if (classData) {
        return { valid: true, classId: classData.id, className: `${classData.grade}${classData.name}` };
      }
    }
    
    return { valid: true };
  }

  async getAllInviteCodes(): Promise<InviteCode[]> {
    return db.select().from(inviteCodes);
  }

  async createInviteCode(inviteCode: InsertInviteCode): Promise<InviteCode> {
    const [newCode] = await db.insert(inviteCodes).values(inviteCode).returning();
    return newCode;
  }

  async getSubject(id: number): Promise<Subject | undefined> {
    const [subject] = await db.select().from(subjects).where(eq(subjects.id, id));
    return subject;
  }

  async getSubjectsByClass(classId: number): Promise<Subject[]> {
    return db.select().from(subjects).where(eq(subjects.classId, classId));
  }

  async createSubject(subject: InsertSubject): Promise<Subject> {
    const [newSubject] = await db.insert(subjects).values(subject).returning();
    return newSubject;
  }

  async getGradesByStudent(studentId: number): Promise<Grade[]> {
    return db.select().from(grades).where(eq(grades.studentId, studentId)).orderBy(grades.date);
  }

  async getGradesByStudentAndSubject(studentId: number, subjectId: number): Promise<Grade[]> {
    return db.select().from(grades)
      .where(and(eq(grades.studentId, studentId), eq(grades.subjectId, subjectId)))
      .orderBy(grades.date);
  }

  async getAverageGradeByStudent(studentId: number): Promise<number> {
    const result = await db.select({
      avg: sql<number>`AVG(${grades.grade})::float`
    }).from(grades).where(eq(grades.studentId, studentId));
    return result[0]?.avg || 0;
  }

  async getAverageGradeBySubject(studentId: number, subjectId: number): Promise<number> {
    const result = await db.select({
      avg: sql<number>`AVG(${grades.grade})::float`
    }).from(grades)
      .where(and(eq(grades.studentId, studentId), eq(grades.subjectId, subjectId)));
    return result[0]?.avg || 0;
  }

  async createGrade(grade: InsertGrade): Promise<Grade> {
    const [newGrade] = await db.insert(grades).values(grade).returning();
    return newGrade;
  }

  async getHomeworkByClass(classId: number): Promise<Homework[]> {
    return db.select().from(homework).where(eq(homework.classId, classId)).orderBy(homework.dueDate);
  }

  async getHomework(id: number): Promise<Homework | undefined> {
    const [hw] = await db.select().from(homework).where(eq(homework.id, id));
    return hw;
  }

  async createHomework(hw: InsertHomework): Promise<Homework> {
    const [newHomework] = await db.insert(homework).values(hw).returning();
    return newHomework;
  }

  async getHomeworkSubmission(homeworkId: number, studentId: number): Promise<HomeworkSubmission | undefined> {
    const [submission] = await db.select().from(homeworkSubmissions)
      .where(and(eq(homeworkSubmissions.homeworkId, homeworkId), eq(homeworkSubmissions.studentId, studentId)));
    return submission;
  }

  async createHomeworkSubmission(submission: InsertHomeworkSubmission): Promise<HomeworkSubmission> {
    const [newSubmission] = await db.insert(homeworkSubmissions).values(submission).returning();
    return newSubmission;
  }

  async updateHomeworkSubmission(id: number, data: Partial<InsertHomeworkSubmission>): Promise<HomeworkSubmission | undefined> {
    const [updated] = await db.update(homeworkSubmissions).set(data).where(eq(homeworkSubmissions.id, id)).returning();
    return updated;
  }

  async getScheduleByClass(classId: number, isEvenWeek?: boolean): Promise<ScheduleItem[]> {
    if (isEvenWeek !== undefined) {
      return db.select().from(scheduleItems)
        .where(and(eq(scheduleItems.classId, classId), eq(scheduleItems.isEvenWeek, isEvenWeek)))
        .orderBy(scheduleItems.dayOfWeek, scheduleItems.startTime);
    }
    return db.select().from(scheduleItems)
      .where(eq(scheduleItems.classId, classId))
      .orderBy(scheduleItems.dayOfWeek, scheduleItems.startTime);
  }

  async createScheduleItem(item: InsertScheduleItem): Promise<ScheduleItem> {
    const [newItem] = await db.insert(scheduleItems).values(item).returning();
    return newItem;
  }

  async updateScheduleItem(id: number, data: Partial<InsertScheduleItem>): Promise<ScheduleItem | undefined> {
    const [updated] = await db.update(scheduleItems).set(data).where(eq(scheduleItems.id, id)).returning();
    return updated;
  }

  async deleteScheduleItem(id: number): Promise<void> {
    await db.delete(scheduleItems).where(eq(scheduleItems.id, id));
  }

  async getEvents(classId?: number): Promise<Event[]> {
    if (classId) {
      return db.select().from(events).where(eq(events.classId, classId)).orderBy(events.date);
    }
    return db.select().from(events).orderBy(events.date);
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db.insert(events).values(event).returning();
    return newEvent;
  }

  async updateEvent(id: number, data: Partial<InsertEvent>): Promise<Event | undefined> {
    const [updated] = await db.update(events).set(data).where(eq(events.id, id)).returning();
    return updated;
  }

  async deleteEvent(id: number): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  async getNews(): Promise<News[]> {
    return db.select().from(news).orderBy(news.createdAt);
  }

  async getNewsItem(id: number): Promise<News | undefined> {
    const [item] = await db.select().from(news).where(eq(news.id, id));
    return item;
  }

  async createNews(newsItem: InsertNews): Promise<News> {
    const [newNews] = await db.insert(news).values(newsItem).returning();
    return newNews;
  }

  async updateNews(id: number, data: Partial<InsertNews>): Promise<News | undefined> {
    const [updated] = await db.update(news).set(data).where(eq(news.id, id)).returning();
    return updated;
  }

  async deleteNews(id: number): Promise<void> {
    await db.delete(news).where(eq(news.id, id));
  }

  async getCafeteriaMenu(): Promise<CafeteriaMenuItem[]> {
    return db.select().from(cafeteriaMenu).orderBy(cafeteriaMenu.category);
  }

  async getCafeteriaMenuItem(id: number): Promise<CafeteriaMenuItem | undefined> {
    const [item] = await db.select().from(cafeteriaMenu).where(eq(cafeteriaMenu.id, id));
    return item;
  }

  async createCafeteriaMenuItem(item: InsertCafeteriaMenuItem): Promise<CafeteriaMenuItem> {
    const [newItem] = await db.insert(cafeteriaMenu).values(item).returning();
    return newItem;
  }

  async updateCafeteriaMenuItem(id: number, data: Partial<InsertCafeteriaMenuItem>): Promise<CafeteriaMenuItem | undefined> {
    const [updated] = await db.update(cafeteriaMenu).set(data).where(eq(cafeteriaMenu.id, id)).returning();
    return updated;
  }

  async deleteCafeteriaMenuItem(id: number): Promise<void> {
    await db.delete(cafeteriaMenu).where(eq(cafeteriaMenu.id, id));
  }

  async getAttendanceByStudent(studentId: number): Promise<Attendance[]> {
    return db.select().from(attendance).where(eq(attendance.studentId, studentId)).orderBy(attendance.date);
  }

  async getAttendanceByStudentAndDate(studentId: number, date: string): Promise<Attendance | undefined> {
    const [result] = await db.select().from(attendance).where(
      and(eq(attendance.studentId, studentId), eq(attendance.date, date))
    );
    return result;
  }

  async createAttendance(att: InsertAttendance): Promise<Attendance> {
    const [newAttendance] = await db.insert(attendance).values(att).returning();
    return newAttendance;
  }

  async getStudentsByClass(classId: number): Promise<User[]> {
    return db.select().from(users).where(and(eq(users.classId, classId), eq(users.role, "student")));
  }

  async getChatMessages(homeworkId: number): Promise<ChatMessage[]> {
    return db.select().from(chatMessages).where(eq(chatMessages.homeworkId, homeworkId)).orderBy(chatMessages.createdAt);
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db.insert(chatMessages).values(message).returning();
    return newMessage;
  }
}

export const storage = new DatabaseStorage();
