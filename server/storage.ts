import { db } from "./db";
import { eq, and, sql, or, desc, asc, inArray } from "drizzle-orm";
import {
  users, classes, inviteCodes, subjects, grades, homework,
  homeworkSubmissions, scheduleItems, events, news, cafeteriaMenu,
  attendance, chatMessages, achievements, psychologistMessages, teacherSubjects, onlineLessons,
  userProfiles, privateChats, privateMessages, friendships, giftTypes, sentGifts,
  achievementTypes, achievementProgress, parentChildren,
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
  type Achievement, type InsertAchievement,
  type PsychologistMessage, type InsertPsychologistMessage,
  type TeacherSubject, type InsertTeacherSubject,
  type OnlineLesson, type InsertOnlineLesson,
  type UserProfile, type InsertUserProfile,
  type PrivateChat, type InsertPrivateChat,
  type PrivateMessage, type InsertPrivateMessage,
  type Friendship, type InsertFriendship,
  type GiftType, type InsertGiftType,
  type SentGift, type InsertSentGift,
  type AchievementType, type InsertAchievementType,
  type AchievementProgress, type InsertAchievementProgress,
  type ParentChild, type InsertParentChild,
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
  getClassChatMessages(classId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  getLeaderboard(minGrade: number, maxGrade: number, limit?: number): Promise<{studentId: number; name: string; classId: number; className: string; averageGrade: number}[]>;
  
  getAchievementsByStudent(studentId: number): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  
  incrementInviteCodeUsage(code: string): Promise<void>;
  
  getPsychologistMessages(studentId: number): Promise<PsychologistMessage[]>;
  getAllPsychologistChats(): Promise<{studentId: number; studentName: string; lastMessage: string; unreadCount: number}[]>;
  createPsychologistMessage(message: InsertPsychologistMessage): Promise<PsychologistMessage>;
  markPsychologistMessagesRead(studentId: number): Promise<void>;
  
  getTeacherSubjects(teacherId: number): Promise<TeacherSubject[]>;
  setTeacherSubjects(teacherId: number, subjects: string[]): Promise<void>;
  
  getOnlineLessons(classId: number): Promise<OnlineLesson[]>;
  createOnlineLesson(lesson: InsertOnlineLesson): Promise<OnlineLesson>;
  updateOnlineLesson(id: number, data: Partial<InsertOnlineLesson>): Promise<OnlineLesson | undefined>;
  
  getUsersByRole(role: string): Promise<User[]>;
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
    // Специальные коды - роль определяется по коду, а не выбором пользователя
    if (code === "CEO-MASTER-2024") {
      return { valid: true };
    }
    
    if (code === "PARENT-2024") {
      return { valid: true };
    }
    
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

  async getClassChatMessages(classId: number): Promise<ChatMessage[]> {
    return db.select().from(chatMessages).where(eq(chatMessages.classId, classId)).orderBy(chatMessages.createdAt);
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db.insert(chatMessages).values(message).returning();
    return newMessage;
  }

  async getLeaderboard(minGrade: number, maxGrade: number, limit: number = 10): Promise<{studentId: number; name: string; classId: number; className: string; averageGrade: number}[]> {
    const result = await db.execute(sql`
      SELECT 
        u.id as student_id,
        CONCAT(u.last_name, ' ', u.first_name) as name,
        u.class_id,
        CONCAT(c.grade, c.name) as class_name,
        COALESCE(AVG(g.grade), 0) as average_grade
      FROM users u
      LEFT JOIN classes c ON u.class_id = c.id
      LEFT JOIN grades g ON g.student_id = u.id
      WHERE u.role = 'student' 
        AND c.grade >= ${minGrade} 
        AND c.grade <= ${maxGrade}
      GROUP BY u.id, u.last_name, u.first_name, u.class_id, c.grade, c.name
      HAVING COUNT(g.id) > 0
      ORDER BY average_grade DESC
      LIMIT ${limit}
    `);
    
    return (result.rows as any[]).map(row => ({
      studentId: row.student_id,
      name: row.name,
      classId: row.class_id,
      className: row.class_name,
      averageGrade: parseFloat(row.average_grade) || 0,
    }));
  }

  async getAchievementsByStudent(studentId: number): Promise<Achievement[]> {
    return db.select().from(achievements).where(eq(achievements.studentId, studentId)).orderBy(achievements.earnedAt);
  }

  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const [newAchievement] = await db.insert(achievements).values(achievement).returning();
    return newAchievement;
  }

  async incrementInviteCodeUsage(code: string): Promise<void> {
    await db.execute(sql`UPDATE invite_codes SET used_count = COALESCE(used_count, 0) + 1 WHERE code = ${code}`);
  }

  async getPsychologistMessages(studentId: number): Promise<PsychologistMessage[]> {
    return db.select().from(psychologistMessages).where(eq(psychologistMessages.studentId, studentId)).orderBy(psychologistMessages.createdAt);
  }

  async getAllPsychologistChats(): Promise<{studentId: number; studentName: string; lastMessage: string; unreadCount: number}[]> {
    const result = await db.execute(sql`
      SELECT 
        pm.student_id,
        CONCAT(u.last_name, ' ', u.first_name) as student_name,
        (SELECT message FROM psychologist_messages WHERE student_id = pm.student_id ORDER BY created_at DESC LIMIT 1) as last_message,
        COUNT(CASE WHEN pm.is_read = false AND pm.sender_id = pm.student_id THEN 1 END) as unread_count
      FROM psychologist_messages pm
      JOIN users u ON u.id = pm.student_id
      GROUP BY pm.student_id, u.last_name, u.first_name
      ORDER BY MAX(pm.created_at) DESC
    `);
    return (result.rows as any[]).map(row => ({
      studentId: row.student_id,
      studentName: row.student_name,
      lastMessage: row.last_message || '',
      unreadCount: parseInt(row.unread_count) || 0,
    }));
  }

  async createPsychologistMessage(message: InsertPsychologistMessage): Promise<PsychologistMessage> {
    const [newMessage] = await db.insert(psychologistMessages).values(message).returning();
    return newMessage;
  }

  async markPsychologistMessagesRead(studentId: number): Promise<void> {
    await db.update(psychologistMessages).set({ isRead: true }).where(eq(psychologistMessages.studentId, studentId));
  }

  async getTeacherSubjects(teacherId: number): Promise<TeacherSubject[]> {
    return db.select().from(teacherSubjects).where(eq(teacherSubjects.teacherId, teacherId));
  }

  async setTeacherSubjects(teacherId: number, subjectsList: string[]): Promise<void> {
    await db.delete(teacherSubjects).where(eq(teacherSubjects.teacherId, teacherId));
    if (subjectsList.length > 0) {
      await db.insert(teacherSubjects).values(subjectsList.map(name => ({ teacherId, subjectName: name })));
    }
  }

  async getOnlineLessons(classId: number): Promise<OnlineLesson[]> {
    return db.select().from(onlineLessons).where(eq(onlineLessons.classId, classId)).orderBy(onlineLessons.scheduledAt);
  }

  async createOnlineLesson(lesson: InsertOnlineLesson): Promise<OnlineLesson> {
    const [newLesson] = await db.insert(onlineLessons).values(lesson).returning();
    return newLesson;
  }

  async updateOnlineLesson(id: number, data: Partial<InsertOnlineLesson>): Promise<OnlineLesson | undefined> {
    const [updated] = await db.update(onlineLessons).set(data).where(eq(onlineLessons.id, id)).returning();
    return updated;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, role));
  }

  // ПРИВАТНЫЕ ЧАТЫ
  async getUserProfile(userId: number): Promise<UserProfile | undefined> {
    const profile = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
    return profile[0];
  }

  async createOrUpdateUserProfile(userId: number, data: Partial<InsertUserProfile>): Promise<UserProfile> {
    const existing = await this.getUserProfile(userId);
    if (existing) {
      const [updated] = await db.update(userProfiles).set(data).where(eq(userProfiles.userId, userId)).returning();
      return updated;
    }
    const [created] = await db.insert(userProfiles).values({ userId, ...data } as InsertUserProfile).returning();
    return created;
  }

  async isUsernameAvailable(username: string): Promise<boolean> {
    const existing = await db.select().from(userProfiles).where(sql`LOWER(${userProfiles.username}) = LOWER(${username})`).limit(1);
    return existing.length === 0;
  }

  async searchUsers(query: string): Promise<any[]> {
    // Ищем по username в профилях и по имени в users
    const searchTerm = '%' + query.toLowerCase() + '%';
    
    // Сначала ищем в профилях
    const profileResults = await db
      .select({
        id: userProfiles.id,
        userId: userProfiles.userId,
        username: userProfiles.username,
        bio: userProfiles.bio,
        avatarUrl: userProfiles.avatarUrl,
        status: userProfiles.status,
        isOnline: userProfiles.isOnline,
        lastSeenAt: userProfiles.lastSeenAt,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(userProfiles)
      .leftJoin(users, eq(userProfiles.userId, users.id))
      .where(
        sql`LOWER(${userProfiles.username}) LIKE ${searchTerm} OR LOWER(${users.firstName}) LIKE ${searchTerm} OR LOWER(${users.lastName}) LIKE ${searchTerm}`
      )
      .limit(20);
    
    // Также ищем пользователей БЕЗ профилей по имени
    const usersWithoutProfile = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
      })
      .from(users)
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .where(
        sql`${userProfiles.id} IS NULL AND (LOWER(${users.firstName}) LIKE ${searchTerm} OR LOWER(${users.lastName}) LIKE ${searchTerm})`
      )
      .limit(20);
    
    // Объединяем результаты и создаем профили для пользователей без них
    const usersWithFakeProfile = usersWithoutProfile.map(u => ({
      id: null,
      userId: u.id,
      username: `user_${u.id}`,
      bio: null,
      avatarUrl: null,
      status: null,
      isOnline: false,
      lastSeenAt: null,
      firstName: u.firstName,
      lastName: u.lastName,
    }));
    
    return [...profileResults, ...usersWithFakeProfile];
  }

  async searchUsersByUsername(query: string): Promise<UserProfile[]> {
    return db.select().from(userProfiles).where(sql`${userProfiles.username} ILIKE ${'%' + query + '%'}`);
  }

  async getOrCreatePrivateChat(user1Id: number, user2Id: number): Promise<PrivateChat> {
    const existing = await db.select().from(privateChats)
      .where(
        sql`(${privateChats.user1Id} = ${user1Id} AND ${privateChats.user2Id} = ${user2Id}) OR (${privateChats.user1Id} = ${user2Id} AND ${privateChats.user2Id} = ${user1Id})`
      ).limit(1);
    
    if (existing.length > 0) {
      return existing[0];
    }
    
    const [newChat] = await db.insert(privateChats).values({ 
      user1Id: Math.min(user1Id, user2Id), 
      user2Id: Math.max(user1Id, user2Id) 
    } as InsertPrivateChat).returning();
    return newChat;
  }

  async getPrivateChatsByUser(userId: number): Promise<PrivateChat[]> {
    return db.select().from(privateChats)
      .where(sql`${privateChats.user1Id} = ${userId} OR ${privateChats.user2Id} = ${userId}`)
      .orderBy(sql`${privateChats.lastMessageAt} DESC NULLS LAST`);
  }

  async getPrivateChatMessages(chatId: number, limit: number = 50, offset: number = 0): Promise<PrivateMessage[]> {
    return db.select().from(privateMessages)
      .where(eq(privateMessages.chatId, chatId))
      .orderBy(privateMessages.createdAt)
      .limit(limit)
      .offset(offset);
  }

  async sendPrivateMessage(chatId: number, senderId: number, message: InsertPrivateMessage): Promise<PrivateMessage> {
    const [newMessage] = await db.insert(privateMessages)
      .values({ chatId, senderId, ...message } as PrivateMessage)
      .returning();
    
    // Обновляем lastMessageAt в чате
    await db.update(privateChats)
      .set({ lastMessageAt: new Date() })
      .where(eq(privateChats.id, chatId));
    
    return newMessage;
  }

  async markMessagesAsRead(chatId: number, userId: number): Promise<void> {
    await db.update(privateMessages)
      .set({ isRead: true, readAt: new Date() })
      .where(and(
        eq(privateMessages.chatId, chatId),
        sql`${privateMessages.senderId} != ${userId}`
      ));
  }

  async deletePrivateMessage(messageId: number, userId: number, forAll: boolean): Promise<{ success: boolean; chatId?: number }> {
    // Сначала получим сообщение, чтобы проверить права
    const [message] = await db.select().from(privateMessages)
      .where(eq(privateMessages.id, messageId))
      .limit(1);
    
    if (!message) {
      return { success: false };
    }
    
    // Проверяем, что пользователь - отправитель сообщения
    if (message.senderId !== userId) {
      return { success: false };
    }
    
    if (forAll) {
      // Удаляем сообщение полностью
      await db.delete(privateMessages)
        .where(eq(privateMessages.id, messageId));
    } else {
      // Для "удалить у меня" - можно добавить поле deletedFor в схему
      // Пока просто удаляем для всех
      await db.delete(privateMessages)
        .where(eq(privateMessages.id, messageId));
    }
    
    return { success: true, chatId: message.chatId };
  }

  async getPrivateMessage(messageId: number): Promise<PrivateMessage | undefined> {
    const [message] = await db.select().from(privateMessages)
      .where(eq(privateMessages.id, messageId))
      .limit(1);
    return message;
  }

  // ДРУЗЬЯ
  async sendFriendRequest(userId: number, friendId: number): Promise<Friendship> {
    // Проверяем, нет ли уже заявки
    const existing = await db.select().from(friendships)
      .where(
        sql`(${friendships.userId} = ${userId} AND ${friendships.friendId} = ${friendId}) OR (${friendships.userId} = ${friendId} AND ${friendships.friendId} = ${userId})`
      ).limit(1);
    
    if (existing.length > 0) {
      return existing[0];
    }
    
    const [newFriendship] = await db.insert(friendships).values({ 
      userId, 
      friendId, 
      status: "pending" 
    } as InsertFriendship).returning();
    return newFriendship;
  }

  async acceptFriendRequest(friendshipId: number): Promise<Friendship | undefined> {
    const [updated] = await db.update(friendships)
      .set({ status: "accepted", acceptedAt: new Date() })
      .where(eq(friendships.id, friendshipId))
      .returning();
    return updated;
  }

  async declineFriendRequest(friendshipId: number): Promise<void> {
    await db.update(friendships)
      .set({ status: "declined" })
      .where(eq(friendships.id, friendshipId));
  }

  async removeFriend(userId: number, friendId: number): Promise<void> {
    await db.delete(friendships)
      .where(
        sql`(${friendships.userId} = ${userId} AND ${friendships.friendId} = ${friendId}) OR (${friendships.userId} = ${friendId} AND ${friendships.friendId} = ${userId})`
      );
  }

  async getFriends(userId: number): Promise<any[]> {
    const result = await db
      .select({
        friendshipId: friendships.id,
        friendId: sql<number>`CASE WHEN ${friendships.userId} = ${userId} THEN ${friendships.friendId} ELSE ${friendships.userId} END`,
        status: friendships.status,
        createdAt: friendships.createdAt,
        acceptedAt: friendships.acceptedAt,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(friendships)
      .leftJoin(users, sql`users.id = CASE WHEN ${friendships.userId} = ${userId} THEN ${friendships.friendId} ELSE ${friendships.userId} END`)
      .where(
        sql`(${friendships.userId} = ${userId} OR ${friendships.friendId} = ${userId}) AND ${friendships.status} = 'accepted'`
      );
    
    return result;
  }

  async getFriendRequests(userId: number): Promise<any[]> {
    const result = await db
      .select({
        friendshipId: friendships.id,
        fromUserId: friendships.userId,
        status: friendships.status,
        createdAt: friendships.createdAt,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(friendships)
      .leftJoin(users, eq(friendships.userId, users.id))
      .where(
        sql`${friendships.friendId} = ${userId} AND ${friendships.status} = 'pending'`
      );
    
    return result;
  }

  async areFriends(userId1: number, userId2: number): Promise<boolean> {
    const result = await db.select().from(friendships)
      .where(
        sql`((${friendships.userId} = ${userId1} AND ${friendships.friendId} = ${userId2}) OR (${friendships.userId} = ${userId2} AND ${friendships.friendId} = ${userId1})) AND ${friendships.status} = 'accepted'`
      ).limit(1);
    return result.length > 0;
  }

  async getFriendsCount(userId: number): Promise<number> {
    const result = await db.select({ count: sql<number>`COUNT(*)` }).from(friendships)
      .where(
        sql`(${friendships.userId} = ${userId} OR ${friendships.friendId} = ${userId}) AND ${friendships.status} = 'accepted'`
      );
    return result[0]?.count || 0;
  }

  // ПОДАРКИ
  async getAllGiftTypes(): Promise<GiftType[]> {
    return db.select().from(giftTypes).where(eq(giftTypes.isActive, true)).orderBy(giftTypes.price);
  }

  async getGiftType(id: number): Promise<GiftType | undefined> {
    const [gift] = await db.select().from(giftTypes).where(eq(giftTypes.id, id));
    return gift;
  }

  async createGiftType(data: InsertGiftType): Promise<GiftType> {
    const [newGift] = await db.insert(giftTypes).values(data).returning();
    return newGift;
  }

  async sendGift(senderId: number, receiverId: number, giftTypeId: number, message?: string, isAnonymous?: boolean): Promise<SentGift> {
    const [sentGift] = await db.insert(sentGifts).values({
      senderId,
      receiverId,
      giftTypeId,
      message,
      isAnonymous: isAnonymous || false,
    } as InsertSentGift).returning();
    return sentGift;
  }

  async getReceivedGifts(userId: number): Promise<any[]> {
    const result = await db
      .select({
        id: sentGifts.id,
        senderId: sentGifts.senderId,
        giftTypeId: sentGifts.giftTypeId,
        message: sentGifts.message,
        isAnonymous: sentGifts.isAnonymous,
        isOpened: sentGifts.isOpened,
        createdAt: sentGifts.createdAt,
        openedAt: sentGifts.openedAt,
        giftName: giftTypes.name,
        giftEmoji: giftTypes.emoji,
        giftRarity: giftTypes.rarity,
        giftPrice: giftTypes.price,
        senderFirstName: users.firstName,
        senderLastName: users.lastName,
      })
      .from(sentGifts)
      .leftJoin(giftTypes, eq(sentGifts.giftTypeId, giftTypes.id))
      .leftJoin(users, eq(sentGifts.senderId, users.id))
      .where(eq(sentGifts.receiverId, userId))
      .orderBy(sql`${sentGifts.createdAt} DESC`);
    
    return result;
  }

  async getSentGifts(userId: number): Promise<any[]> {
    const result = await db
      .select({
        id: sentGifts.id,
        receiverId: sentGifts.receiverId,
        giftTypeId: sentGifts.giftTypeId,
        message: sentGifts.message,
        isAnonymous: sentGifts.isAnonymous,
        isOpened: sentGifts.isOpened,
        createdAt: sentGifts.createdAt,
        giftName: giftTypes.name,
        giftEmoji: giftTypes.emoji,
        giftRarity: giftTypes.rarity,
        giftPrice: giftTypes.price,
        receiverFirstName: users.firstName,
        receiverLastName: users.lastName,
      })
      .from(sentGifts)
      .leftJoin(giftTypes, eq(sentGifts.giftTypeId, giftTypes.id))
      .leftJoin(users, eq(sentGifts.receiverId, users.id))
      .where(eq(sentGifts.senderId, userId))
      .orderBy(sql`${sentGifts.createdAt} DESC`);
    
    return result;
  }

  async openGift(giftId: number, userId: number): Promise<SentGift | undefined> {
    const [updated] = await db.update(sentGifts)
      .set({ isOpened: true, openedAt: new Date() })
      .where(and(eq(sentGifts.id, giftId), eq(sentGifts.receiverId, userId)))
      .returning();
    return updated;
  }

  async getGiftsCount(userId: number): Promise<number> {
    const result = await db.select({ count: sql<number>`COUNT(*)` }).from(sentGifts)
      .where(eq(sentGifts.receiverId, userId));
    return result[0]?.count || 0;
  }

  // Инициализация дефолтных типов подарков
  async seedDefaultGiftTypes(): Promise<void> {
    const existingTypes = await db.select().from(giftTypes).limit(1);
    if (existingTypes.length > 0) return; // Уже есть подарки

    const defaultGifts: InsertGiftType[] = [
      { name: "Плюшевый мишка", emoji: "🧸", price: 10, rarity: "common", description: "Мягкий и милый" },
      { name: "Красное сердце", emoji: "❤️", price: 5, rarity: "common", description: "Символ любви" },
      { name: "Букет роз", emoji: "🌹", price: 25, rarity: "rare", description: "Романтичный подарок" },
      { name: "Торт", emoji: "🎂", price: 30, rarity: "rare", description: "На праздник!" },
      { name: "Единорог", emoji: "🦄", price: 150, rarity: "legendary", description: "Волшебное существо" },
      { name: "Фейерверк", emoji: "🎆", price: 75, rarity: "legendary", description: "Яркие эмоции" },
      { name: "Бриллиант", emoji: "💎", price: 500, rarity: "epic", description: "Самый ценный" },
      { name: "Котенок", emoji: "🐱", price: 20, rarity: "rare", description: "Пушистый друг" },
      { name: "Звезда", emoji: "⭐", price: 15, rarity: "common", description: "Ты звезда!" },
      { name: "Радуга", emoji: "🌈", price: 100, rarity: "legendary", description: "Красочный подарок" },
      { name: "Корона", emoji: "👑", price: 300, rarity: "epic", description: "Для королей" },
      { name: "Ракета", emoji: "🚀", price: 50, rarity: "rare", description: "К звёздам!" },
    ];

    await db.insert(giftTypes).values(defaultGifts);
    console.log("[Storage] Добавлены дефолтные типы подарков");
  }

  // ============== ДОСТИЖЕНИЯ ==============
  
  async getAllAchievementTypes(): Promise<AchievementType[]> {
    return db.select().from(achievementTypes).where(eq(achievementTypes.isActive, true));
  }

  async getAchievementType(id: number): Promise<AchievementType | undefined> {
    const [type] = await db.select().from(achievementTypes).where(eq(achievementTypes.id, id));
    return type;
  }

  async createAchievementType(data: InsertAchievementType): Promise<AchievementType> {
    const [created] = await db.insert(achievementTypes).values(data).returning();
    return created;
  }

  async getUserAchievementProgress(userId: number): Promise<any[]> {
    const result = await db
      .select({
        progressId: achievementProgress.id,
        currentProgress: achievementProgress.currentProgress,
        isCompleted: achievementProgress.isCompleted,
        completedAt: achievementProgress.completedAt,
        achievementId: achievementTypes.id,
        code: achievementTypes.code,
        name: achievementTypes.name,
        description: achievementTypes.description,
        emoji: achievementTypes.emoji,
        category: achievementTypes.category,
        requirement: achievementTypes.requirement,
        xpReward: achievementTypes.xpReward,
        rarity: achievementTypes.rarity,
      })
      .from(achievementProgress)
      .innerJoin(achievementTypes, eq(achievementProgress.achievementTypeId, achievementTypes.id))
      .where(eq(achievementProgress.userId, userId));
    
    return result;
  }

  async getCompletedAchievements(userId: number): Promise<any[]> {
    const result = await db
      .select({
        progressId: achievementProgress.id,
        completedAt: achievementProgress.completedAt,
        achievementId: achievementTypes.id,
        code: achievementTypes.code,
        name: achievementTypes.name,
        description: achievementTypes.description,
        emoji: achievementTypes.emoji,
        category: achievementTypes.category,
        xpReward: achievementTypes.xpReward,
        rarity: achievementTypes.rarity,
      })
      .from(achievementProgress)
      .innerJoin(achievementTypes, eq(achievementProgress.achievementTypeId, achievementTypes.id))
      .where(and(eq(achievementProgress.userId, userId), eq(achievementProgress.isCompleted, true)));
    
    return result;
  }

  async updateAchievementProgress(userId: number, achievementTypeId: number, increment: number = 1): Promise<any> {
    // Получаем тип достижения
    const achievementType = await this.getAchievementType(achievementTypeId);
    if (!achievementType) return null;

    // Ищем существующий прогресс
    const [existing] = await db.select().from(achievementProgress)
      .where(and(eq(achievementProgress.userId, userId), eq(achievementProgress.achievementTypeId, achievementTypeId)));

    if (existing) {
      // Если уже выполнено - ничего не делаем
      if (existing.isCompleted) return existing;

      const newProgress = existing.currentProgress + increment;
      const isCompleted = newProgress >= achievementType.requirement;

      const [updated] = await db.update(achievementProgress)
        .set({ 
          currentProgress: newProgress, 
          isCompleted,
          completedAt: isCompleted ? new Date() : null 
        })
        .where(eq(achievementProgress.id, existing.id))
        .returning();
      
      return { ...updated, justCompleted: isCompleted && !existing.isCompleted };
    } else {
      // Создаём новый прогресс
      const isCompleted = increment >= achievementType.requirement;
      const [created] = await db.insert(achievementProgress).values({
        userId,
        achievementTypeId,
        currentProgress: increment,
        isCompleted,
      } as InsertAchievementProgress).returning();
      
      return { ...created, justCompleted: isCompleted };
    }
  }

  async initUserAchievements(userId: number): Promise<void> {
    const types = await this.getAllAchievementTypes();
    const existing = await db.select().from(achievementProgress).where(eq(achievementProgress.userId, userId));
    const existingTypeIds = existing.map(e => e.achievementTypeId);
    
    for (const type of types) {
      if (!existingTypeIds.includes(type.id)) {
        await db.insert(achievementProgress).values({
          userId,
          achievementTypeId: type.id,
          currentProgress: 0,
          isCompleted: false,
        } as InsertAchievementProgress);
      }
    }
  }

  async seedDefaultAchievementTypes(): Promise<void> {
    const existing = await db.select().from(achievementTypes).limit(1);
    if (existing.length > 0) return;

    const defaults: InsertAchievementType[] = [
      { code: "first_grade", name: "Первая оценка", description: "Получите первую оценку", emoji: "📝", category: "academic", requirement: 1, xpReward: 10, rarity: "common" },
      { code: "ten_grades", name: "Отличный старт", description: "Получите 10 оценок", emoji: "📚", category: "academic", requirement: 10, xpReward: 25, rarity: "common" },
      { code: "fifty_grades", name: "Усердный ученик", description: "Получите 50 оценок", emoji: "🎓", category: "academic", requirement: 50, xpReward: 50, rarity: "rare" },
      { code: "perfect_five", name: "Пятёрочник", description: "Получите 5 пятёрок подряд", emoji: "⭐", category: "academic", requirement: 5, xpReward: 75, rarity: "rare" },
      { code: "homework_done", name: "Домашка сделана!", description: "Сдайте первое домашнее задание", emoji: "✅", category: "academic", requirement: 1, xpReward: 15, rarity: "common" },
      { code: "ten_homework", name: "Ответственный", description: "Сдайте 10 домашних заданий", emoji: "📋", category: "academic", requirement: 10, xpReward: 40, rarity: "rare" },
      { code: "first_friend", name: "Первый друг", description: "Добавьте первого друга", emoji: "👋", category: "social", requirement: 1, xpReward: 10, rarity: "common" },
      { code: "five_friends", name: "Дружная компания", description: "Добавьте 5 друзей", emoji: "👥", category: "social", requirement: 5, xpReward: 30, rarity: "rare" },
      { code: "gift_giver", name: "Щедрый", description: "Отправьте первый подарок", emoji: "🎁", category: "social", requirement: 1, xpReward: 15, rarity: "common" },
      { code: "ten_gifts", name: "Даритель", description: "Отправьте 10 подарков", emoji: "🎀", category: "social", requirement: 10, xpReward: 50, rarity: "rare" },
      { code: "message_master", name: "Общительный", description: "Отправьте 100 сообщений", emoji: "💬", category: "social", requirement: 100, xpReward: 35, rarity: "rare" },
      { code: "week_streak", name: "Неделя в школе", description: "Посещайте приложение 7 дней подряд", emoji: "🔥", category: "attendance", requirement: 7, xpReward: 40, rarity: "rare" },
      { code: "month_streak", name: "Месяц активности", description: "Посещайте приложение 30 дней", emoji: "🏆", category: "attendance", requirement: 30, xpReward: 100, rarity: "epic" },
      { code: "early_bird", name: "Ранняя пташка", description: "Зайдите до 7 утра", emoji: "🌅", category: "special", requirement: 1, xpReward: 20, rarity: "rare" },
      { code: "night_owl", name: "Ночная сова", description: "Зайдите после 23:00", emoji: "🦉", category: "special", requirement: 1, xpReward: 20, rarity: "rare" },
      { code: "top_student", name: "Лучший ученик", description: "Войдите в топ-3 рейтинга", emoji: "👑", category: "special", requirement: 1, xpReward: 200, rarity: "legendary" },
    ];

    await db.insert(achievementTypes).values(defaults);
    console.log("[Storage] Добавлены дефолтные типы достижений");
  }

  // ============== РОДИТЕЛЬСКИЙ ПОРТАЛ ==============

  async linkParentToChild(parentId: number, childId: number, verificationCode?: string): Promise<ParentChild> {
    const [link] = await db.insert(parentChildren).values({
      parentId,
      childId,
      status: "pending",
      verificationCode: verificationCode || Math.random().toString(36).substring(2, 8).toUpperCase(),
    } as InsertParentChild).returning();
    return link;
  }

  async approveParentLink(linkId: number): Promise<ParentChild | undefined> {
    const [updated] = await db.update(parentChildren)
      .set({ status: "approved", approvedAt: new Date() })
      .where(eq(parentChildren.id, linkId))
      .returning();
    return updated;
  }

  async rejectParentLink(linkId: number): Promise<void> {
    await db.update(parentChildren)
      .set({ status: "rejected" })
      .where(eq(parentChildren.id, linkId));
  }

  async getChildrenByParent(parentId: number): Promise<any[]> {
    const result = await db
      .select({
        linkId: parentChildren.id,
        status: parentChildren.status,
        childId: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        classId: users.classId,
        role: users.role,
      })
      .from(parentChildren)
      .innerJoin(users, eq(parentChildren.childId, users.id))
      .where(and(eq(parentChildren.parentId, parentId), eq(parentChildren.status, "approved")));
    
    return result;
  }

  async getPendingParentRequests(childId: number): Promise<any[]> {
    const result = await db
      .select({
        linkId: parentChildren.id,
        parentId: users.id,
        parentFirstName: users.firstName,
        parentLastName: users.lastName,
        verificationCode: parentChildren.verificationCode,
        createdAt: parentChildren.createdAt,
      })
      .from(parentChildren)
      .innerJoin(users, eq(parentChildren.parentId, users.id))
      .where(and(eq(parentChildren.childId, childId), eq(parentChildren.status, "pending")));
    
    return result;
  }

  async findChildByCode(code: string): Promise<any | null> {
    // Ищем ученика по коду приглашения
    const [student] = await db.select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      classId: users.classId,
    }).from(users).where(and(eq(users.inviteCode, code), eq(users.role, "student")));
    
    return student || null;
  }

  async getChildGradesForParent(childId: number): Promise<any[]> {
    const result = await db
      .select({
        gradeId: grades.id,
        grade: grades.grade,
        date: grades.date,
        comment: grades.comment,
        subjectName: subjects.name,
        teacherFirstName: users.firstName,
        teacherLastName: users.lastName,
      })
      .from(grades)
      .innerJoin(subjects, eq(grades.subjectId, subjects.id))
      .leftJoin(users, eq(grades.teacherId, users.id))
      .where(eq(grades.studentId, childId))
      .orderBy(desc(grades.createdAt));
    
    return result;
  }

  // ============== ДОМАШНИЕ ЗАДАНИЯ ==============

  async getHomeworkByClassWithDetails(classId: number): Promise<any[]> {
    const result = await db
      .select({
        id: homework.id,
        title: homework.title,
        description: homework.description,
        dueDate: homework.dueDate,
        createdAt: homework.createdAt,
        subjectName: subjects.name,
        teacherFirstName: users.firstName,
        teacherLastName: users.lastName,
      })
      .from(homework)
      .innerJoin(subjects, eq(homework.subjectId, subjects.id))
      .leftJoin(users, eq(homework.teacherId, users.id))
      .where(eq(homework.classId, classId))
      .orderBy(desc(homework.dueDate));
    
    return result;
  }

  async createHomeworkWithTeacher(data: InsertHomework): Promise<Homework> {
    const [created] = await db.insert(homework).values(data).returning();
    return created;
  }

  async deleteHomework(id: number): Promise<void> {
    await db.delete(homework).where(eq(homework.id, id));
  }

  async updateHomework(id: number, data: Partial<InsertHomework>): Promise<Homework | undefined> {
    const [updated] = await db.update(homework).set(data).where(eq(homework.id, id)).returning();
    return updated;
  }

  async getHomeworkSubmissionsByHomework(homeworkId: number): Promise<any[]> {
    const result = await db
      .select({
        submissionId: homeworkSubmissions.id,
        content: homeworkSubmissions.content,
        photoUrl: homeworkSubmissions.photoUrl,
        submittedAt: homeworkSubmissions.submittedAt,
        grade: homeworkSubmissions.grade,
        feedback: homeworkSubmissions.feedback,
        studentId: users.id,
        studentFirstName: users.firstName,
        studentLastName: users.lastName,
      })
      .from(homeworkSubmissions)
      .innerJoin(users, eq(homeworkSubmissions.studentId, users.id))
      .where(eq(homeworkSubmissions.homeworkId, homeworkId))
      .orderBy(desc(homeworkSubmissions.submittedAt));
    
    return result;
  }

  async gradeHomeworkSubmission(submissionId: number, grade: number, feedback?: string): Promise<HomeworkSubmission | undefined> {
    const [updated] = await db.update(homeworkSubmissions)
      .set({ grade, feedback })
      .where(eq(homeworkSubmissions.id, submissionId))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();

// Инициализация дефолтных данных при старте
storage.seedDefaultGiftTypes().catch(console.error);
storage.seedDefaultAchievementTypes().catch(console.error);
