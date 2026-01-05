import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, date, serial, decimal, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  grade: integer("grade").notNull(),
  inviteCode: text("invite_code").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const users = pgTable(
  "users",
  {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").notNull().default("student"),
  classId: integer("class_id").references(() => classes.id),
  inviteCode: text("invite_code").notNull(),
  parentOfId: integer("parent_of_id"),
  createdById: integer("created_by_id"),
  studentCode: text("student_code"),
  createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    parentOfFk: foreignKey({
      columns: [table.parentOfId],
      foreignColumns: [table.id],
    }),
  }),
);

export const inviteCodes = pgTable("invite_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  role: text("role").notNull(),
  classId: integer("class_id").references(() => classes.id),
  isActive: boolean("is_active").default(true),
  usedCount: integer("used_count").default(0),
  maxUses: integer("max_uses"),
  createdById: integer("created_by_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  teacherId: integer("teacher_id").references(() => users.id),
  classId: integer("class_id").references(() => classes.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const grades = pgTable("grades", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => users.id),
  subjectId: integer("subject_id").notNull().references(() => subjects.id),
  grade: integer("grade").notNull(),
  date: date("date").notNull(),
  comment: text("comment"),
  teacherId: integer("teacher_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const homework = pgTable("homework", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id").notNull().references(() => subjects.id),
  classId: integer("class_id").notNull().references(() => classes.id),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: date("due_date").notNull(),
  teacherId: integer("teacher_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const homeworkSubmissions = pgTable("homework_submissions", {
  id: serial("id").primaryKey(),
  homeworkId: integer("homework_id").notNull().references(() => homework.id),
  studentId: integer("student_id").notNull().references(() => users.id),
  content: text("content"),
  photoUrl: text("photo_url"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  grade: integer("grade"),
  feedback: text("feedback"),
});

export const scheduleItems = pgTable("schedule_items", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull().references(() => classes.id),
  subjectId: integer("subject_id").notNull().references(() => subjects.id),
  teacherId: integer("teacher_id").references(() => users.id),
  dayOfWeek: integer("day_of_week").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  room: text("room"),
  isEvenWeek: boolean("is_even_week"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  date: date("date").notNull(),
  time: text("time"),
  location: text("location"),
  type: text("type").notNull().default("event"),
  classId: integer("class_id").references(() => classes.id),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const news = pgTable("news", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  isImportant: boolean("is_important").default(false),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cafeteriaMenu = pgTable("cafeteria_menu", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  isAvailable: boolean("is_available").default(true),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => users.id),
  date: date("date").notNull(),
  status: text("status").notNull(),
  scheduleItemId: integer("schedule_item_id").references(() => scheduleItems.id),
  markedById: integer("marked_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  homeworkId: integer("homework_id").references(() => homework.id),
  classId: integer("class_id").references(() => classes.id),
  senderId: integer("sender_id").notNull().references(() => users.id),
  message: text("message"),
  mediaType: text("media_type"),
  mediaUrl: text("media_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const psychologistMessages = pgTable("psychologist_messages", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => users.id),
  psychologistId: integer("psychologist_id").references(() => users.id),
  senderId: integer("sender_id").notNull().references(() => users.id),
  message: text("message"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const teacherSubjects = pgTable("teacher_subjects", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull().references(() => users.id),
  subjectName: text("subject_name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const onlineLessons = pgTable("online_lessons", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull().references(() => classes.id),
  teacherId: integer("teacher_id").notNull().references(() => users.id),
  subjectId: integer("subject_id").references(() => subjects.id),
  title: text("title").notNull(),
  meetingUrl: text("meeting_url"),
  meetingCode: text("meeting_code"),
  scheduledAt: timestamp("scheduled_at").notNull(),
  duration: integer("duration").default(45),
  status: text("status").default("scheduled"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  earnedAt: timestamp("earned_at").defaultNow(),
});

// ТИПЫ ДОСТИЖЕНИЙ (шаблоны)
export const achievementTypes = pgTable("achievement_types", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // 'perfect_attendance', 'top_student', etc.
  name: text("name").notNull(),
  description: text("description"),
  emoji: text("emoji").notNull(),
  category: text("category").notNull().default("general"), // 'academic', 'social', 'attendance', 'special'
  requirement: integer("requirement").notNull().default(1), // сколько нужно для получения
  xpReward: integer("xp_reward").notNull().default(10),
  rarity: text("rarity").notNull().default("common"), // 'common', 'rare', 'epic', 'legendary'
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// ПРОГРЕСС ДОСТИЖЕНИЙ
export const achievementProgress = pgTable("achievement_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  achievementTypeId: integer("achievement_type_id").notNull().references(() => achievementTypes.id),
  currentProgress: integer("current_progress").notNull().default(0),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// СВЯЗЬ РОДИТЕЛЬ-РЕБЁНОК
export const parentChildren = pgTable("parent_children", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id").notNull().references(() => users.id),
  childId: integer("child_id").notNull().references(() => users.id),
  status: text("status").notNull().default("pending"), // 'pending', 'approved', 'rejected'
  verificationCode: text("verification_code"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// НОВЫЕ ТАБЛИЦЫ ДЛЯ ПРИВАТНЫХ ЧАТОВ
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => users.id),
  username: text("username").notNull().unique(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  phoneNumber: text("phone_number"),
  birthday: text("birthday"),
  favoriteMusic: text("favorite_music"),
  status: text("status"),
  isOnline: boolean("is_online").default(false),
  lastSeenAt: timestamp("last_seen_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userProfilePhotos = pgTable("user_profile_photos", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  photoUrl: text("photo_url").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const privateChats = pgTable("private_chats", {
  id: serial("id").primaryKey(),
  user1Id: integer("user1_id").notNull().references(() => users.id),
  user2Id: integer("user2_id").notNull().references(() => users.id),
  // Pinned/Muted для каждого пользователя отдельно
  isPinned1: boolean("is_pinned_1").default(false),
  isPinned2: boolean("is_pinned_2").default(false),
  isMuted1: boolean("is_muted_1").default(false),
  isMuted2: boolean("is_muted_2").default(false),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const privateMessages = pgTable("private_messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull().references(() => privateChats.id),
  senderId: integer("sender_id").notNull().references(() => users.id),
  message: text("message"),
  mediaType: text("media_type"), // 'photo', 'video', 'voice', 'video_circle', 'file'
  mediaUrl: text("media_url"),
  mediaFileName: text("media_file_name"),
  mediaSize: integer("media_size"), // в байтах
  mediaDuration: integer("media_duration"), // для аудио/видео в секундах
  mediaWidth: integer("media_width"),
  mediaHeight: integer("media_height"),
  // Reply
  replyToId: integer("reply_to_id"),
  // Forward
  forwardedFromId: integer("forwarded_from_id").references(() => users.id),
  // Статусы
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  isEdited: boolean("is_edited").default(false),
  editedAt: timestamp("edited_at"),
  isDeleted: boolean("is_deleted").default(false),
  deletedAt: timestamp("deleted_at"),
  deletedForAll: boolean("deleted_for_all").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// РЕАКЦИИ НА СООБЩЕНИЯ
export const messageReactions = pgTable("message_reactions", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull().references(() => privateMessages.id, { onDelete: 'cascade' }),
  userId: integer("user_id").notNull().references(() => users.id),
  emoji: text("emoji").notNull(), // ❤️, 👍, 😂, 🔥, 😢, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// ЗАБЛОКИРОВАННЫЕ ПОЛЬЗОВАТЕЛИ
export const blockedUsers = pgTable("blocked_users", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  blockedUserId: integer("blocked_user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// ТАБЛИЦА ДРУЗЕЙ
export const friendships = pgTable("friendships", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  friendId: integer("friend_id").notNull().references(() => users.id),
  status: text("status").notNull().default("pending"), // 'pending', 'accepted', 'declined', 'blocked'
  createdAt: timestamp("created_at").defaultNow(),
  acceptedAt: timestamp("accepted_at"),
});

// ТАБЛИЦА ПОДАРКОВ
export const giftTypes = pgTable("gift_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  emoji: text("emoji").notNull(),
  price: integer("price").notNull(),
  rarity: text("rarity").notNull().default("common"), // 'common', 'rare', 'legendary', 'epic'
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// ==================== БЕЗОПАСНОСТЬ И АУТЕНТИФИКАЦИЯ ====================

// СЕССИИ (JWT refresh tokens)
export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  refreshToken: text("refresh_token").notNull().unique(),
  deviceInfo: text("device_info"), // User-Agent, device name
  ipAddress: text("ip_address"),
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  lastUsedAt: timestamp("last_used_at").defaultNow(),
});

// PUSH-ТОКЕНЫ ДЛЯ УВЕДОМЛЕНИЙ (Expo / FCM)
export const pushTokens = pgTable("push_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  token: text("token").notNull(),
  platform: text("platform").notNull(), // 'ios', 'android', 'web'
  deviceType: text("device_type"), // модель устройства
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// БАЛАНС ЗВЁЗД (серверный, защищённый)
export const userStars = pgTable("user_stars", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => users.id),
  balance: integer("balance").notNull().default(0),
  totalEarned: integer("total_earned").notNull().default(0),
  totalSpent: integer("total_spent").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ТРАНЗАКЦИИ ЗВЁЗД (аудит)
export const starTransactions = pgTable("star_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(), // положительное = заработал, отрицательное = потратил
  type: text("type").notNull(), // 'earn', 'spend', 'gift_send', 'gift_receive', 'admin_add'
  reason: text("reason"), // 'message', 'photo', 'gift_to_user_123', etc.
  relatedId: integer("related_id"), // ID подарка, сообщения и т.д.
  balanceAfter: integer("balance_after").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ОТПРАВЛЕННЫЕ ПОДАРКИ
export const sentGifts = pgTable("sent_gifts", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  giftTypeId: integer("gift_type_id").notNull().references(() => giftTypes.id),
  message: text("message"),
  isAnonymous: boolean("is_anonymous").default(false),
  isOpened: boolean("is_opened").default(false),
  isHidden: boolean("is_hidden").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  openedAt: timestamp("opened_at"),
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({ id: true, earnedAt: true });
export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({ id: true, createdAt: true, lastSeenAt: true });
export const insertUserProfilePhotoSchema = createInsertSchema(userProfilePhotos).omit({ id: true, createdAt: true });
export const insertPrivateChatSchema = createInsertSchema(privateChats).omit({ id: true, createdAt: true, lastMessageAt: true });
export const insertPrivateMessageSchema = createInsertSchema(privateMessages).omit({ id: true, createdAt: true, readAt: true, editedAt: true, deletedAt: true });
export const insertMessageReactionSchema = createInsertSchema(messageReactions).omit({ id: true, createdAt: true });
export const insertBlockedUserSchema = createInsertSchema(blockedUsers).omit({ id: true, createdAt: true });
export const insertPushTokenSchema = createInsertSchema(pushTokens).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertInviteCodeSchema = createInsertSchema(inviteCodes).omit({ id: true, createdAt: true });
export const insertClassSchema = createInsertSchema(classes).omit({ id: true, createdAt: true });
export const insertSubjectSchema = createInsertSchema(subjects).omit({ id: true, createdAt: true });
export const insertGradeSchema = createInsertSchema(grades).omit({ id: true, createdAt: true });
export const insertHomeworkSchema = createInsertSchema(homework).omit({ id: true, createdAt: true });
export const insertHomeworkSubmissionSchema = createInsertSchema(homeworkSubmissions).omit({ id: true, submittedAt: true });
export const insertScheduleItemSchema = createInsertSchema(scheduleItems).omit({ id: true, createdAt: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true });
export const insertNewsSchema = createInsertSchema(news).omit({ id: true, createdAt: true });
export const insertCafeteriaMenuSchema = createInsertSchema(cafeteriaMenu).omit({ id: true, createdAt: true });
export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true, createdAt: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, createdAt: true });
export const insertPsychologistMessageSchema = createInsertSchema(psychologistMessages).omit({ id: true, createdAt: true });
export const insertTeacherSubjectSchema = createInsertSchema(teacherSubjects).omit({ id: true, createdAt: true });
export const insertOnlineLessonSchema = createInsertSchema(onlineLessons).omit({ id: true, createdAt: true });
export const insertFriendshipSchema = createInsertSchema(friendships).omit({ id: true, createdAt: true, acceptedAt: true });
export const insertGiftTypeSchema = createInsertSchema(giftTypes).omit({ id: true, createdAt: true });
export const insertSentGiftSchema = createInsertSchema(sentGifts).omit({ id: true, createdAt: true, openedAt: true });
export const insertUserSessionSchema = createInsertSchema(userSessions).omit({ id: true, createdAt: true, lastUsedAt: true });
export const insertUserStarsSchema = createInsertSchema(userStars).omit({ id: true, createdAt: true, updatedAt: true });
export const insertStarTransactionSchema = createInsertSchema(starTransactions).omit({ id: true, createdAt: true });
export const insertAchievementTypeSchema = createInsertSchema(achievementTypes).omit({ id: true, createdAt: true });
export const insertAchievementProgressSchema = createInsertSchema(achievementProgress).omit({ id: true, createdAt: true, completedAt: true });
export const insertParentChildSchema = createInsertSchema(parentChildren).omit({ id: true, createdAt: true, approvedAt: true });

export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InviteCode = typeof inviteCodes.$inferSelect;
export type InsertInviteCode = z.infer<typeof insertInviteCodeSchema>;
export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Grade = typeof grades.$inferSelect;
export type InsertGrade = z.infer<typeof insertGradeSchema>;
export type Homework = typeof homework.$inferSelect;
export type InsertHomework = z.infer<typeof insertHomeworkSchema>;
export type HomeworkSubmission = typeof homeworkSubmissions.$inferSelect;
export type InsertHomeworkSubmission = z.infer<typeof insertHomeworkSubmissionSchema>;
export type ScheduleItem = typeof scheduleItems.$inferSelect;
export type InsertScheduleItem = z.infer<typeof insertScheduleItemSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type News = typeof news.$inferSelect;
export type InsertNews = z.infer<typeof insertNewsSchema>;
export type CafeteriaMenuItem = typeof cafeteriaMenu.$inferSelect;
export type InsertCafeteriaMenuItem = z.infer<typeof insertCafeteriaMenuSchema>;
export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type PsychologistMessage = typeof psychologistMessages.$inferSelect;
export type InsertPsychologistMessage = z.infer<typeof insertPsychologistMessageSchema>;
export type TeacherSubject = typeof teacherSubjects.$inferSelect;
export type InsertTeacherSubject = z.infer<typeof insertTeacherSubjectSchema>;
export type OnlineLesson = typeof onlineLessons.$inferSelect;
export type InsertOnlineLesson = z.infer<typeof insertOnlineLessonSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;

export type UserProfilePhoto = typeof userProfilePhotos.$inferSelect;
export type InsertUserProfilePhoto = z.infer<typeof insertUserProfilePhotoSchema>;
export type PrivateChat = typeof privateChats.$inferSelect;
export type InsertPrivateChat = z.infer<typeof insertPrivateChatSchema>;
export type PrivateMessage = typeof privateMessages.$inferSelect;
export type InsertPrivateMessage = z.infer<typeof insertPrivateMessageSchema>;
export type MessageReaction = typeof messageReactions.$inferSelect;
export type InsertMessageReaction = z.infer<typeof insertMessageReactionSchema>;
export type BlockedUser = typeof blockedUsers.$inferSelect;
export type InsertBlockedUser = z.infer<typeof insertBlockedUserSchema>;
export type Friendship = typeof friendships.$inferSelect;
export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;
export type GiftType = typeof giftTypes.$inferSelect;
export type InsertGiftType = z.infer<typeof insertGiftTypeSchema>;
export type SentGift = typeof sentGifts.$inferSelect;
export type InsertSentGift = z.infer<typeof insertSentGiftSchema>;
export type AchievementType = typeof achievementTypes.$inferSelect;
export type InsertAchievementType = z.infer<typeof insertAchievementTypeSchema>;
export type AchievementProgress = typeof achievementProgress.$inferSelect;
export type InsertAchievementProgress = z.infer<typeof insertAchievementProgressSchema>;
export type ParentChild = typeof parentChildren.$inferSelect;
export type InsertParentChild = z.infer<typeof insertParentChildSchema>;

export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type UserStars = typeof userStars.$inferSelect;
export type InsertUserStars = z.infer<typeof insertUserStarsSchema>;
export type StarTransaction = typeof starTransactions.$inferSelect;
export type InsertStarTransaction = z.infer<typeof insertStarTransactionSchema>;
