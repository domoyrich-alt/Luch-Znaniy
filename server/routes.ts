import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import path from "path";
// @ts-ignore
import multer from "multer";
import fs from "fs";
import { setupWebSocket, notifyNewMessage, addUserToChat, isUserOnline, broadcastToChat } from "./websocket";
import { createSession, refreshTokens, revokeSession, revokeAllUserSessions, authMiddleware, AuthRequest } from "./auth";

function detectRoleFromCode(code: string): string | null {
  if (code === "CEO-MASTER-2024") return "ceo";
  if (code === "PARENT-2024") return "parent";
  if (code.startsWith("CLASS") && code.includes("-")) return "student";
  if (code.startsWith("TEACHER-")) return "teacher";
  if (code. startsWith("DIRECTOR-")) return "director";
  if (code.startsWith("CURATOR-")) return "curator";
  if (code.startsWith("COOK-")) return "cook";
  return null;
}

// Конфиг для загрузки файлов
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    cb(null, uploadDir);
  },
  filename: (req: any, file: any, cb: any) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, name + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage: storage_multer,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/quicktime",
      "video/mpeg",
      "application/pdf",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Недопустимый тип файла"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/auth/login", async (req:  Request, res: Response) => {
    try {
      const { inviteCode, firstName, lastName } = req.body;

      if (!inviteCode) {
        return res.status(400).json({ error: "Код приглашения обязателен" });
      }

      const code = inviteCode.toUpperCase();
      
      const detectedRole = detectRoleFromCode(code);
      if (!detectedRole) {
        return res. status(400).json({ error: "Неверный код приглашения" });
      }

      const validation = await storage.validateInviteCode(code, detectedRole);
      
      if (!validation. valid) {
        return res.status(400).json({ error: validation.error });
      }

      let user = await storage. getUserByInviteCode(code);
      let isNewUser = false;
      
      if (!user) {
        user = await storage.createUser({
          firstName: (firstName || "").trim() || "Пользователь",
          lastName: (lastName || "").trim() || "",
          role: detectedRole as any,
          classId: (validation.classId || null) as any,
          inviteCode: code,
        });
        isNewUser = true;
      }

      // Проверяем, есть ли у пользователя профиль с username
      const profile = await storage.getUserProfile(user.id);
      const needsProfileSetup = isNewUser || !profile || !profile.username;

      // Создаём JWT сессию
      const deviceInfo = req.headers['user-agent'] || 'Unknown device';
      const { accessToken, refreshToken, expiresIn } = await createSession(user.id, deviceInfo);

      // Инициализируем баланс звёзд для нового пользователя
      if (isNewUser) {
        await storage.addStars(user.id, 100, 'welcome_bonus', 'Бонус за регистрацию');
      }

      res.json({
        user: {
          id:  user.id,
          firstName: user. firstName,
          lastName: user.lastName,
          role: user.role,
          classId: user.classId,
          className: validation.className,
        },
        needsProfileSetup,
        auth: {
          accessToken,
          refreshToken,
          expiresIn,
        },
      });

    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // Получить информацию о пользователе
  app.get("/api/user/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(parseInt(userId));
      
      if (!user) {
        return res.status(404).json({ error: "Пользователь не найден" });
      }

      let className = "";
      if (user.classId) {
        const classData = await storage.getClass(user.classId);
        if (classData) {
          className = `${classData.grade}${classData.name}`;
        }
      }

      res.json({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        classId: user.classId,
        className,
        studentCode: user.studentCode,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.get("/api/student-code/:studentId", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const requesterId = req.userId;
      
      if (requesterId !== studentId) {
        const requester = await storage.getUser(requesterId!);
        if (!requester || !['ceo', 'director', 'teacher'].includes(requester.role)) {
          return res.status(403).json({ error: "Нет доступа к коду другого пользователя" });
        }
      }
      
      const user = await storage.getUser(studentId);
      
      if (!user) {
        return res.status(404).json({ error: "Пользователь не найден" });
      }
      
      if (user.role !== "student") {
        return res.status(400).json({ error: "Код доступен только для учеников" });
      }
      
      let studentCode = user.studentCode;
      
      if (!studentCode) {
        studentCode = await storage.generateStudentCode(studentId);
      }
      
      res.json({ code: studentCode });
    } catch (error) {
      console.error("Get student code error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.post("/api/parent/link-by-code", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { studentCode } = req.body;
      const parentId = req.userId;
      
      if (!parentId) {
        return res.status(401).json({ error: "Требуется авторизация" });
      }
      
      const parent = await storage.getUser(parentId);
      if (!parent || parent.role !== "parent") {
        return res.status(403).json({ error: "Только родители могут привязывать детей" });
      }
      
      if (!studentCode) {
        return res.status(400).json({ error: "studentCode обязателен" });
      }
      
      const child = await storage.getUserByStudentCode(studentCode.toUpperCase());
      
      if (!child) {
        return res.status(404).json({ error: "Ученик с таким кодом не найден" });
      }
      
      const link = await storage.linkParentToChild(parentId, child.id);
      
      res.json({
        success: true,
        childId: child.id,
        childName: `${child.firstName} ${child.lastName}`,
        message: `Ребёнок ${child.firstName} ${child.lastName} успешно добавлен!`
      });
    } catch (error) {
      console.error("Link parent by code error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.get("/api/verify-code/:code", async (req: Request, res: Response) => {
    try {
      const { code } = req.params;
      const inviteCode = await storage.getInviteCode(code.toUpperCase());

      if (!inviteCode || !inviteCode. isActive) {
        return res.status(404).json({ error: "Код не найден или неактивен" });
      }

      let className = "";
      if (inviteCode. classId) {
        const classData = await storage.getClass(inviteCode.classId);
        if (classData) {
          className = `${classData.grade}${classData.name}`;
        }
      }

      res.json({
        valid: true,
        role: inviteCode. role,
        className,
      });

    } catch (error) {
      console.error("Verify code error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.get("/api/classes", async (_req: Request, res: Response) => {
    try {
      const classes = await storage.getAllClasses();
      res.json(classes);
    } catch (error) {
      console.error("Get classes error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // ДОБАВЛЕН: POST /api/classes для создания классов
  app.post("/api/classes", async (req: Request, res: Response) => {
    try {
      const { grade, name } = req.body;
      if (!grade || !name) {
        return res.status(400).json({ error: "Номер и буква класса обязательны" });
      }
      
      const inviteCode = `CLASS${grade}${name}-${Math.floor(Math.random() * 10000)}`;
      const newClass = await storage.createClass({
        grade: parseInt(grade.toString()),
        name: name.toString(),
        inviteCode
      });
      res.json(newClass);
    } catch (error) {
      console.error("Create class error:", error);
      res.status(500).json({ error: "Ошибка создания класса" });
    }
  });

  app.get("/api/class/:classId/students", async (req: Request, res:  Response) => {
    try {
      const classId = parseInt(req.params.classId);
      const students = await storage.getStudentsByClass(classId);
      const today = new Date().toISOString().split("T")[0];
      
      const studentsWithAttendance = await Promise.all(
        students.map(async (student: any) => {
          const attendance = await storage.getAttendanceByStudentAndDate(student.id, today);
          return {
            id: student.id,
            name: `${student.lastName || ''} ${student.firstName || ''}`.trim() || 'Ученик',
            todayStatus: attendance?. status || "absent",
          };
        })
      );
      
      res. json(studentsWithAttendance);
    } catch (error) {
      console.error("Get class students error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // Получить одноклассников с профилями и средним баллом
  app.get("/api/classmates/:classId", async (req: Request, res: Response) => {
    try {
      const classId = parseInt(req.params.classId);
      const students = await storage.getStudentsByClass(classId);
      
      const classmatesWithProfiles = await Promise.all(
        students.map(async (student: any) => {
          const profile = await storage.getUserProfile(student.id);
          const avgGrade = await storage.getAverageGradeByStudent(student.id);
          
          return {
            id: student.id,
            firstName: student.firstName || 'Ученик',
            lastName: student.lastName || '',
            username: profile?.username ? `@${profile.username}` : null,
            avatar: profile?.avatarUrl || null,
            isOnline: false, // TODO: реализовать онлайн статус
            avgGrade: Math.round(avgGrade * 10) / 10 || 0,
          };
        })
      );
      
      res.json(classmatesWithProfiles);
    } catch (error) {
      console.error("Get classmates error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.get("/api/subjects/:classId", async (req: Request, res: Response) => {
    try {
      const classId = parseInt(req.params.classId);
      const subjects = await storage.getSubjectsByClass(classId);
      res.json(subjects);
    } catch (error) {
      console.error("Get subjects error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.get("/api/grades/:studentId", async (req: Request, res:  Response) => {
    try {
      const studentId = parseInt(req.params. studentId);
      const grades = await storage.getGradesByStudent(studentId);
      const averageGrade = await storage.getAverageGradeByStudent(studentId);
      res.json({ grades, averageGrade: Math.round(averageGrade * 100) / 100 });
    } catch (error) {
      console. error("Get grades error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.get("/api/grades/:studentId/subject/:subjectId", async (req: Request, res: Response) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const subjectId = parseInt(req.params.subjectId);
      const grades = await storage.getGradesByStudentAndSubject(studentId, subjectId);
      const averageGrade = await storage.getAverageGradeBySubject(studentId, subjectId);
      res.json({ grades, averageGrade: Math.round(averageGrade * 100) / 100 });
    } catch (error) {
      console.error("Get grades by subject error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.post("/api/grades", async (req: Request, res: Response) => {
    try {
      const { studentId, subjectId, grade, date, comment, teacherId } = req. body;
      
      if (!studentId || !subjectId || ! grade || !date) {
        return res.status(400).json({ error: "Все поля обязательны" });
      }

      if (grade < 1 || grade > 5) {
        return res.status(400).json({ error: "Оценка должна быть от 1 до 5" });
      }

      const newGrade = await storage.createGrade({
        studentId,
        subjectId,
        grade,
        date,
        comment,
        teacherId,
      });

      res.json(newGrade);
    } catch (error) {
      console.error("Create grade error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.get("/api/homework/:classId", async (req: Request, res: Response) => {
    try {
      const classId = parseInt(req.params.classId);
      const homeworkList = await storage.getHomeworkByClass(classId);
      res.json(homeworkList);
    } catch (error) {
      console.error("Get homework error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // ИЗМЕНЕНО: Добавлена поддержка subjectName для домашки
  app.post("/api/homework", async (req: Request, res: Response) => {
    try {
      const { subjectId, classId, title, description, dueDate, teacherId, subjectName } = req.body;

      if (!classId || !title || !dueDate) {
        return res.status(400).json({ error: "Обязательные поля: класс, название, дата сдачи" });
      }

      // Если subjectName передан, добавляем его к названию
      let finalTitle = title;
      if (subjectName && !subjectId) {
        finalTitle = `[${subjectName}] ${title}`;
      }

      const homework = await storage.createHomework({
        subjectId:  subjectId || 1, // Fallback ID если не передан
        classId,
        title:  finalTitle,
        description,
        dueDate,
        teacherId:  teacherId || 1,
      });

      res.json(homework);
    } catch (error) {
      console.error("Create homework error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.get("/api/homework/:homeworkId/submission/:studentId", async (req: Request, res: Response) => {
    try {
      const homeworkId = parseInt(req.params.homeworkId);
      const studentId = parseInt(req.params.studentId);
      const submission = await storage.getHomeworkSubmission(homeworkId, studentId);
      res.json(submission || null);
    } catch (error) {
      console.error("Get submission error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.post("/api/homework/:homeworkId/submit", async (req: Request, res: Response) => {
    try {
      const homeworkId = parseInt(req.params. homeworkId);
      const { studentId, content, photoUrl } = req.body;

      if (!studentId) {
        return res.status(400).json({ error: "ID ученика обязателен" });
      }

      const submission = await storage.createHomeworkSubmission({
        homeworkId,
        studentId,
        content,
        photoUrl,
      });

      res.json(submission);
    } catch (error) {
      console.error("Submit homework error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.get("/api/schedule/:classId", async (req: Request, res: Response) => {
    try {
      const classId = parseInt(req.params.classId);
      const isEvenWeek = req.query.isEvenWeek === "true" ?  true : req.query.isEvenWeek === "false" ? false : undefined;
      const schedule = await storage.getScheduleByClass(classId, isEvenWeek);
      res.json(schedule);
    } catch (error) {
      console.error("Get schedule error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // ИСПРАВЛЕНО: Убрана обязательность subjectId для расписания
  app.post("/api/schedule", async (req: Request, res: Response) => {
    try {
      const { classId, subjectId, teacherId, dayOfWeek, startTime, endTime, room, isEvenWeek, subject, subjectName } = req.body;

      if (!classId || dayOfWeek === undefined || ! startTime || !endTime) {
        return res.status(400).json({ error: "Обязательные поля:  класс, день недели, время начала и конца" });
      }

      const classIdNum = parseInt(classId);
      const dayOfWeekNum = parseInt(dayOfWeek);
      const desiredSubjectName = String(subjectName || subject || "Урок").trim() || "Урок";

      // subjectId обязателен в БД (FK на subjects), поэтому подбираем валидный id
      let resolvedSubjectId: number | undefined;
      if (subjectId !== undefined && subjectId !== null && `${subjectId}`.trim() !== "") {
        const candidate = parseInt(subjectId);
        if (!Number.isNaN(candidate)) {
          const existing = await storage.getSubject(candidate);
          if (existing) resolvedSubjectId = existing.id;
        }
      }

      if (!resolvedSubjectId) {
        const classSubjects = await storage.getSubjectsByClass(classIdNum);
        const normalizedDesired = desiredSubjectName.toLowerCase();

        const byName = classSubjects.find((s) => String(s.name || "").trim().toLowerCase() === normalizedDesired);
        if (byName) {
          resolvedSubjectId = byName.id;
        } else if (classSubjects.length > 0) {
          // Если предметы уже есть, но такого названия нет — создаём новый
          const created = await storage.createSubject({
            name: desiredSubjectName,
            classId: classIdNum,
            teacherId: teacherId ? parseInt(teacherId) : undefined,
          });
          resolvedSubjectId = created.id;
        } else {
          // Если предметов вообще нет — создаём первый
          const created = await storage.createSubject({
            name: desiredSubjectName,
            classId: classIdNum,
            teacherId: teacherId ? parseInt(teacherId) : undefined,
          });
          resolvedSubjectId = created.id;
        }
      }

      const resolvedTeacherId = teacherId ? parseInt(teacherId) : undefined;

      const item = await storage.createScheduleItem({
        classId: classIdNum,
        subjectId: resolvedSubjectId,
        teacherId: Number.isNaN(resolvedTeacherId as any) ? undefined : resolvedTeacherId,
        dayOfWeek: dayOfWeekNum,
        startTime,
        endTime,
        room:  room || "", // Кабинет необязательный
        isEvenWeek: isEvenWeek !== undefined ? isEvenWeek : null,
      });

      res.json(item);
    } catch (error) {
      console.error("Create schedule error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.put("/api/schedule/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateScheduleItem(id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Расписание не найдено" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Update schedule error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.delete("/api/schedule/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteScheduleItem(id);
      res.json({ message: "Удалено" });
    } catch (error) {
      console.error("Delete schedule error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.get("/api/events", async (req: Request, res: Response) => {
    try {
      const classId = req.query.classId ? parseInt(req.query.classId as string) : undefined;
      const eventsList = await storage.getEvents(classId);
      res.json(eventsList);
    } catch (error) {
      console.error("Get events error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.post("/api/events", async (req: Request, res: Response) => {
    try {
      const { title, description, date, time, location, type, classId, createdById } = req.body;

      if (!title || !date) {
        return res.status(400).json({ error: "Название и дата обязательны" });
      }

      const event = await storage.createEvent({
        title,
        description,
        date,
        time,
        location,
        type:  type || "event",
        classId,
        createdById,
      });

      res.json(event);
    } catch (error) {
      console.error("Create event error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.put("/api/events/: id", async (req: Request, res:  Response) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateEvent(id, req.body);
      if (!updated) {
        return res. status(404).json({ error: "Мероприятие не найдено" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Update event error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.delete("/api/events/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEvent(id);
      res.json({ message: "Удалено" });
    } catch (error) {
      console.error("Delete event error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.get("/api/news", async (_req: Request, res: Response) => {
    try {
      const newsList = await storage. getNews();
      res.json(newsList);
    } catch (error) {
      console.error("Get news error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.post("/api/news", async (req:  Request, res: Response) => {
    try {
      const { title, content, imageUrl, isImportant, createdById } = req.body;

      if (!title || !content) {
        return res.status(400).json({ error: "Заголовок и содержание обязательны" });
      }

      const newsItem = await storage. createNews({
        title,
        content,
        imageUrl,
        isImportant,
        createdById,
      });

      res.json(newsItem);
    } catch (error) {
      console.error("Create news error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.put("/api/news/: id", async (req: Request, res:  Response) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateNews(id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Новость не найдена" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Update news error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.delete("/api/news/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteNews(id);
      res.json({ message: "Удалено" });
    } catch (error) {
      console.error("Delete news error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.get("/api/cafeteria", async (_req: Request, res: Response) => {
    try {
      const menu = await storage.getCafeteriaMenu();
      res.json(menu);
    } catch (error) {
      console.error("Get cafeteria error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.post("/api/cafeteria", async (req: Request, res: Response) => {
    try {
      const { name, description, price, category, isAvailable, imageUrl } = req.body;

      if (!name || !category) {
        return res.status(400).json({ error: "Название и категория обязательны" });
      }

      const item = await storage.createCafeteriaMenuItem({
        name,
        description: description || "",
        price: (price || "0").toString(),
        category,
        isAvailable: isAvailable !== false,
        imageUrl,
      });

      res.json(item);
    } catch (error) {
      console.error("Create cafeteria item error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.put("/api/cafeteria/:id", async (req: Request, res:  Response) => {
    try {
      const id = parseInt(req.params.id);
      const data = { ...req.body };
      if (data.price !== undefined) {
        data.price = data.price.toString();
      }
      const updated = await storage.updateCafeteriaMenuItem(id, data);
      if (!updated) {
        return res.status(404).json({ error: "Блюдо не найдено" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Update cafeteria item error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.delete("/api/cafeteria/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage. deleteCafeteriaMenuItem(id);
      res.json({ message: "Удалено" });
    } catch (error) {
      console.error("Delete cafeteria item error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.get("/api/attendance/: studentId", async (req: Request, res: Response) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const attendanceList = await storage.getAttendanceByStudent(studentId);
      res.json(attendanceList);
    } catch (error) {
      console.error("Get attendance error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.post("/api/attendance", async (req: Request, res: Response) => {
    try {
      const { studentId, date, status, scheduleItemId, markedById } = req.body;

      if (! studentId || !date || !status) {
        return res.status(400).json({ error: "ID ученика, дата и статус обязательны" });
      }

      const attendance = await storage.createAttendance({
        studentId,
        date,
        status,
        scheduleItemId,
        markedById,
      });

      res.json(attendance);
    } catch (error) {
      console.error("Create attendance error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // ДОБАВЛЕН:  Endpoint для отметки attendance 
  app.post("/api/attendance/mark", async (req: Request, res:  Response) => {
    try {
      const { studentId, status } = req.body;
      
      if (!studentId || !status) {
        return res. status(400).json({ error: "ID ученика и статус обязательны" });
      }

      const today = new Date().toISOString().split("T")[0];
      
      const attendance = await storage. createAttendance({
        studentId,
        date: today,
        status,
        scheduleItemId: null,
        markedById:  studentId,
      });

      res.json(attendance);
    } catch (error) {
      console.error("Mark attendance error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.get("/api/attendance-stats/:studentId", async (req: Request, res: Response) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const attendanceList = await storage.getAttendanceByStudent(studentId);
      
      const stats = {
        total: attendanceList.length,
        present: attendanceList.filter(a => a.status === "present").length,
        late: attendanceList. filter(a => a.status === "late").length,
        absent: attendanceList.filter(a => a.status === "absent").length,
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Get attendance stats error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.get("/api/chat/: homeworkId", async (req: Request, res: Response) => {
    try {
      const homeworkId = parseInt(req. params.homeworkId);
      const messages = await storage.getChatMessages(homeworkId);
      res.json(messages);
    } catch (error) {
      console. error("Get chat error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.post("/api/chat/:homeworkId", async (req: Request, res: Response) => {
    try {
      const homeworkId = parseInt(req.params.homeworkId);
      const { senderId, message } = req.body;

      if (!senderId || !message) {
        return res.status(400).json({ error: "ID отправителя и сообщение обязательны" });
      }

      const chatMessage = await storage.createChatMessage({
        homeworkId,
        senderId,
        message,
      });

      res.json(chatMessage);
    } catch (error) {
      console.error("Create chat message error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.get("/api/invite-codes", async (_req: Request, res: Response) => {
    try {
      const codes = await storage.getAllInviteCodes();
      res.json(codes);
    } catch (error) {
      console.error("Get invite codes error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.post("/api/invite-codes", async (req:  Request, res: Response) => {
    try {
      const { role, classId, createdById, maxUses } = req. body;

      if (!role || !createdById) {
        return res.status(400).json({ error: "Роль и создатель обязательны" });
      }

      const code = generateInviteCode(role, classId);
      
      const inviteCode = await storage. createInviteCode({
        code,
        role,
        classId: classId || null,
        isActive: true,
        createdById,
        maxUses: maxUses || null,
      });

      res.json(inviteCode);
    } catch (error) {
      console.error("Create invite code error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.get("/api/leaderboard/: level", async (req:  Request, res: Response) => {
    try {
      const { level } = req.params;
      let minGrade: number, maxGrade: number;
      
      switch (level) {
        case "junior":
          minGrade = 1;
          maxGrade = 4;
          break;
        case "middle":
          minGrade = 5;
          maxGrade = 8;
          break;
        case "senior":
          minGrade = 9;
          maxGrade = 11;
          break;
        default: 
          return res.status(400).json({ error: "Неверный уровень. Используйте:  junior, middle, senior" });
      }
      
      const leaderboard = await storage.getLeaderboard(minGrade, maxGrade, 10);
      res.json(leaderboard);
    } catch (error) {
      console.error("Get leaderboard error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.get("/api/class-chat/:classId", async (req: Request, res: Response) => {
    try {
      const classId = parseInt(req. params.classId);
      const messages = await storage.getClassChatMessages(classId);
      
      const messagesWithUsers = await Promise.all(
        messages.map(async (msg: any) => {
          const sender = await storage.getUser(msg.senderId);
          return {
            ...msg,
            senderName: sender ?  `${sender.firstName} ${sender.lastName}`.trim() : "Неизвестный",
          };
        })
      );
      
      res.json(messagesWithUsers);
    } catch (error) {
      console.error("Get class chat error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.post("/api/class-chat/:classId", async (req: Request, res:  Response) => {
    try {
      const classId = parseInt(req.params. classId);
      const { senderId, message } = req.body;

      if (!senderId || !message) {
        return res.status(400).json({ error: "ID отправителя и сообщение обязательны" });
      }

      const chatMessage = await storage.createChatMessage({
        classId,
        senderId,
        message,
      });

      res.json(chatMessage);
    } catch (error) {
      console.error("Create class chat message error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.get("/api/achievements/:studentId", async (req: Request, res: Response) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const achievementsList = await storage.getAchievementsByStudent(studentId);
      res.json(achievementsList);
    } catch (error) {
      console.error("Get achievements error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.post("/api/achievements/: studentId/calculate", async (req:  Request, res: Response) => {
    try {
      const studentId = parseInt(req.params.studentId);
      
      const user = await storage.getUser(studentId);
      if (!user) {
        return res.status(404).json({ error: "Пользователь не найден" });
      }

      const gradesList = await storage.getGradesByStudent(studentId);
      const averageGrade = await storage.getAverageGradeByStudent(studentId);
      
      const existingAchievements = await storage.getAchievementsByStudent(studentId);
      const existingTypes = new Set(existingAchievements.map(a => a. type));
      
      const newAchievements: { type: string; title: string; description:  string; progress: number }[] = [];
      
      if (averageGrade >= 4.5 && !existingTypes.has("excellent_grades")) {
        const progress = Math.min(100, Math.round((averageGrade / 5) * 100));
        newAchievements.push({
          type: "excellent_grades",
          title: "Отличник",
          description:  "Средний балл 4.5 или выше",
          progress,
        });
      }
      
      if (gradesList.length >= 10 && !existingTypes.has("homework_champion")) {
        const progress = Math.min(100, gradesList.length * 2);
        newAchievements.push({
          type:  "homework_champion",
          title: "Прилежный ученик",
          description: "Получено 10+ оценок",
          progress,
        });
      }
      
      for (const achievement of newAchievements) {
        await storage.createAchievement({
          studentId,
          type: achievement.type,
          title: achievement.title,
          description: achievement.description,
        });
      }
      
      const updatedAchievements = await storage.getAchievementsByStudent(studentId);
      res.json(updatedAchievements);
    } catch (error) {
      console.error("Calculate achievements error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.get("/api/psychologist/chats", async (_req: Request, res: Response) => {
    try {
      const chats = await storage.getAllPsychologistChats();
      res.json(chats);
    } catch (error) {
      console.error("Get psychologist chats error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.get("/api/psychologist/messages/:studentId", async (req: Request, res:  Response) => {
    try {
      const studentId = parseInt(req.params. studentId);
      const messages = await storage.getPsychologistMessages(studentId);
      res.json(messages);
    } catch (error) {
      console.error("Get psychologist messages error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.post("/api/psychologist/messages", async (req: Request, res: Response) => {
    try {
      const { studentId, psychologistId, senderId, message } = req.body;
      if (!studentId || ! senderId) {
        return res.status(400).json({ error: "ID студента и отправителя обязательны" });
      }
      const newMessage = await storage. createPsychologistMessage({ studentId, psychologistId, senderId, message });
      res.json(newMessage);
    } catch (error) {
      console.error("Create psychologist message error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.post("/api/psychologist/messages/:studentId/read", async (req:  Request, res: Response) => {
    try {
      const studentId = parseInt(req.params.studentId);
      await storage.markPsychologistMessagesRead(studentId);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark messages read error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.get("/api/teacher-subjects/: teacherId", async (req: Request, res: Response) => {
    try {
      const teacherId = parseInt(req.params.teacherId);
      const subjects = await storage.getTeacherSubjects(teacherId);
      res.json(subjects);
    } catch (error) {
      console.error("Get teacher subjects error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.post("/api/teacher-subjects/:teacherId", async (req: Request, res: Response) => {
    try {
      const teacherId = parseInt(req.params.teacherId);
      const { subjects } = req.body;
      if (!Array.isArray(subjects)) {
        return res.status(400).json({ error: "Предметы должны быть массивом" });
      }
      await storage.setTeacherSubjects(teacherId, subjects);
      const updated = await storage.getTeacherSubjects(teacherId);
      res.json(updated);
    } catch (error) {
      console.error("Set teacher subjects error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.get("/api/online-lessons/:classId", async (req: Request, res:  Response) => {
    try {
      const classId = parseInt(req.params.classId);
      const lessons = await storage.getOnlineLessons(classId);
      res.json(lessons);
    } catch (error) {
      console.error("Get online lessons error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.post("/api/online-lessons", async (req: Request, res: Response) => {
    try {
      const { classId, teacherId, subjectId, title, meetingUrl, meetingCode, scheduledAt, duration } = req.body;
      if (!classId || !teacherId || !title || !scheduledAt) {
        return res.status(400).json({ error: "Класс, учитель, название и время обязательны" });
      }
      const lesson = await storage.createOnlineLesson({ classId, teacherId, subjectId, title, meetingUrl, meetingCode, scheduledAt:  new Date(scheduledAt), duration });
      res.json(lesson);
    } catch (error) {
      console.error("Create online lesson error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.patch("/api/online-lessons/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const lesson = await storage.updateOnlineLesson(id, req.body);
      if (!lesson) {
        return res.status(404).json({ error: "Урок не найден" });
      }
      res.json(lesson);
    } catch (error) {
      console.error("Update online lesson error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.get("/api/users/role/:role", async (req:  Request, res: Response) => {
    try {
      const { role } = req. params;
      const usersList = await storage.getUsersByRole(role);
      res.json(usersList);
    } catch (error) {
      console.error("Get users by role error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // ДОБАВЛЕН: Кружки endpoints
  app.get("/api/clubs", async (_req: Request, res: Response) => {
    try {
      const clubs = [
        { id: 1, name: "Робототехника", teacher: "Петров А.И.", schedule: "Понедельник 15:00", participants: 12, maxParticipants: 15 },
        { id: 2, name: "Театральная студия", teacher: "Иванова М.П.", schedule: "Среда 16:00", participants:  8, maxParticipants: 10 },
        { id: 3, name: "Изостудия", teacher: "Сидорова Е.В.", schedule: "Пятница 14:30", participants: 6, maxParticipants: 12 },
        { id: 4, name: "Математический клуб", teacher:  "Козлов Д.С.", schedule: "Вторник 15:30", participants: 10, maxParticipants: 15 },
      ];
      res. json(clubs);
    } catch (error) {
      console.error("Get clubs error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.post("/api/clubs/: clubId/join", async (req:  Request, res: Response) => {
    try {
      const { clubId } = req.params;
      const { studentId } = req.body;
      
      if (!studentId) {
        return res.status(400).json({ error: "ID ученика обязателен" });
      }
      
      // Здесь будет логика записи в кружок
      res.json({ success: true, message: "Вы записались в кружок!" });
    } catch (error) {
      console.error("Join club error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // ===== ПРИВАТНЫЕ ЧАТЫ =====
  
  // Получить или создать профиль пользователя
  app.get("/api/user/:userId/profile", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const profile = await storage.getUserProfile(parseInt(userId));
      
      if (!profile) {
        // Создаём дефолтный профиль
        const user = await storage.getUser(parseInt(userId));
        if (!user) return res.status(404).json({ error: "Пользователь не найден" });
        
        const newProfile = await storage.createOrUpdateUserProfile(parseInt(userId), {
          username: `user_${userId}`,
          bio: "",
          isOnline: true,
        });
        return res.json(newProfile);
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // Обновить профиль пользователя
  app.patch("/api/user/:userId/profile", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { username, bio, phoneNumber, birthday, favoriteMusic, status, avatarUrl } = req.body;

      const uid = parseInt(userId);
      const before = await storage.getUserProfile(uid);

      const profile = await storage.createOrUpdateUserProfile(uid, {
        username,
        bio,
        phoneNumber,
        birthday,
        favoriteMusic,
        status,
        avatarUrl,
      });

      if (typeof avatarUrl === "string") {
        const trimmed = avatarUrl.trim();
        const beforeUrl = before?.avatarUrl ? String(before.avatarUrl).trim() : "";
        if (trimmed && trimmed !== beforeUrl) {
          await storage.addUserProfilePhoto(uid, trimmed);
        }
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // История фото профиля
  app.get("/api/user/:userId/profile/photos", async (req: Request, res: Response) => {
    try {
      const uid = parseInt(req.params.userId);
      const profile = await storage.getUserProfile(uid);

      // Если история пустая, но аватар уже есть — добавим его в историю один раз
      const existing = await storage.getUserProfilePhotos(uid);
      if (existing.length === 0 && profile?.avatarUrl) {
        await storage.addUserProfilePhoto(uid, String(profile.avatarUrl));
      }

      const photos = await storage.getUserProfilePhotos(uid);
      res.json(photos);
    } catch (error) {
      console.error("Get profile photos error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.delete("/api/user/:userId/profile/photos/:photoId", async (req: Request, res: Response) => {
    try {
      const uid = parseInt(req.params.userId);
      const photoId = parseInt(req.params.photoId);

      const photo = await storage.getUserProfilePhoto(photoId);
      if (!photo || photo.userId !== uid) {
        return res.status(404).json({ error: "Фото не найдено" });
      }

      await storage.deleteUserProfilePhoto(uid, photoId);

      // Если удалили текущее фото профиля — откатим на последнее из истории (или null)
      const profile = await storage.getUserProfile(uid);
      const currentUrl = profile?.avatarUrl ? String(profile.avatarUrl) : "";
      if (currentUrl && currentUrl === String(photo.photoUrl)) {
        const remaining = await storage.getUserProfilePhotos(uid);
        const nextUrl = remaining[0]?.photoUrl ? String(remaining[0].photoUrl) : null;
        await storage.createOrUpdateUserProfile(uid, { avatarUrl: nextUrl as any });
      }

      res.json({ ok: true });
    } catch (error) {
      console.error("Delete profile photo error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // Проверка доступности username
  app.get("/api/users/check-username", async (req: Request, res: Response) => {
    try {
      const { username } = req.query;
      
      if (!username || typeof username !== "string") {
        return res.status(400).json({ error: "Username обязателен" });
      }
      
      const isAvailable = await storage.isUsernameAvailable(username.toLowerCase());
      res.json({ available: isAvailable });
    } catch (error) {
      console.error("Check username error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // Поиск пользователей по username или имени
  app.get("/api/users/search", async (req: Request, res: Response) => {
    try {
      const { query } = req.query;
      
      if (!query || typeof query !== "string") {
        return res.status(400).json({ error: "Query обязателен" });
      }
      
      const results = await storage.searchUsers(query);
      res.json(results);
    } catch (error) {
      console.error("Search users error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // Получить или создать приватный чат
  app.post("/api/chats/private", async (req: Request, res: Response) => {
    try {
      const { user1Id, user2Id } = req.body;
      
      if (!user1Id || !user2Id) {
        return res.status(400).json({ error: "user1Id и user2Id обязательны" });
      }
      
      const chat = await storage.getOrCreatePrivateChat(user1Id, user2Id);
      res.json(chat);
    } catch (error) {
      console.error("Create chat error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // Получить чаты пользователя
  app.get("/api/user/:userId/chats", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const chats = await storage.getPrivateChatsByUser(parseInt(userId));
      
      // Получаем информацию о собеседниках и последнее сообщение
      const chatsWithUsers = await Promise.all(chats.map(async (chat) => {
        const otherUserId = chat.user1Id === parseInt(userId) ? chat.user2Id : chat.user1Id;
        const otherUser = await storage.getUser(otherUserId);
        const otherProfile = await storage.getUserProfile(otherUserId);
        
        // Получаем последнее сообщение (самое новое)
        const lastMessage = await storage.getLastPrivateChatMessage(chat.id);
        
        return {
          ...chat,
          lastMessage,
          otherUser: {
            id: otherUser?.id,
            firstName: otherUser?.firstName,
            lastName: otherUser?.lastName,
            ...otherProfile,
          }
        };
      }));
      
      // Сортируем по дате последнего сообщения
      chatsWithUsers.sort((a, b) => {
        const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
        const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
        return bTime - aTime;
      });
      
      res.json(chatsWithUsers);
    } catch (error) {
      console.error("Get chats error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // Получить сообщения чата
  app.get("/api/chats/:chatId/messages", async (req: Request, res: Response) => {
    try {
      const { chatId } = req.params;
      const { limit = "50", offset = "0" } = req.query;
      
      const messages = await storage.getPrivateChatMessages(
        parseInt(chatId),
        parseInt(limit as string),
        parseInt(offset as string)
      );
      
      res.json(messages);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // Отправить сообщение
  app.post("/api/chats/:chatId/messages", async (req: Request, res: Response) => {
    try {
      const { chatId } = req.params;
      const { senderId, message, mediaType, mediaUrl, mediaFileName, mediaSize, localId, senderName } = req.body;
      
      if (!senderId || (!message && !mediaUrl)) {
        return res.status(400).json({ error: "senderId и message/mediaUrl обязательны" });
      }
      
      const newMessage = await storage.sendPrivateMessage(parseInt(chatId), senderId, {
        message,
        mediaType,
        mediaUrl,
        mediaFileName,
        mediaSize,
      } as any);
      
      // Уведомляем через WebSocket о новом сообщении
      notifyNewMessage(chatId, senderId, {
        ...newMessage,
        localId,
        senderName,
      });
      
      res.json(newMessage);
    } catch (error) {
      console.error("Send message error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // Отметить сообщения как прочитанные
  app.post("/api/chats/:chatId/read", async (req: Request, res: Response) => {
    try {
      const { chatId } = req.params;
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "userId обязателен" });
      }
      
      await storage.markMessagesAsRead(parseInt(chatId), userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark read error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // DELETE - Удалить сообщение
  app.delete("/api/messages/:messageId", async (req: Request, res: Response) => {
    try {
      const { messageId } = req.params;
      const { userId, forAll } = req.body;
      
      if (!userId || !messageId) {
        return res.status(400).json({ error: "Не указан userId или messageId" });
      }
      
      const result = await storage.deletePrivateMessage(
        parseInt(messageId),
        parseInt(userId),
        forAll === true
      );
      
      if (!result.success) {
        return res.status(403).json({ error: "Невозможно удалить это сообщение" });
      }
      
      // Уведомляем через WebSocket
      if (result.chatId) {
        broadcastToChat(result.chatId.toString(), {
          type: 'message_deleted',
          payload: {
            messageId: parseInt(messageId),
            chatId: result.chatId,
            forAll
          },
          timestamp: Date.now()
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Delete message error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  const httpServer = createServer(app);
  
  // ========== ДРУЗЬЯ ==========
  
  // Получить список друзей
  app.get("/api/friends/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const friends = await storage.getFriends(userId);
      res.json(friends);
    } catch (error) {
      console.error("Get friends error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // Получить входящие заявки в друзья
  app.get("/api/friends/:userId/requests", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const requests = await storage.getFriendRequests(userId);
      res.json(requests);
    } catch (error) {
      console.error("Get friend requests error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // Отправить заявку в друзья
  app.post("/api/friends/request", async (req: Request, res: Response) => {
    try {
      const { userId, friendId } = req.body;
      if (!userId || !friendId) {
        return res.status(400).json({ error: "userId и friendId обязательны" });
      }
      const friendship = await storage.sendFriendRequest(userId, friendId);
      res.json(friendship);
    } catch (error) {
      console.error("Send friend request error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // Принять заявку в друзья
  app.post("/api/friends/accept", async (req: Request, res: Response) => {
    try {
      const { friendshipId } = req.body;
      if (!friendshipId) {
        return res.status(400).json({ error: "friendshipId обязателен" });
      }
      const friendship = await storage.acceptFriendRequest(friendshipId);
      res.json(friendship);
    } catch (error) {
      console.error("Accept friend request error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // Отклонить заявку
  app.post("/api/friends/decline", async (req: Request, res: Response) => {
    try {
      const { friendshipId } = req.body;
      if (!friendshipId) {
        return res.status(400).json({ error: "friendshipId обязателен" });
      }
      await storage.declineFriendRequest(friendshipId);
      res.json({ success: true });
    } catch (error) {
      console.error("Decline friend request error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // Удалить из друзей
  app.delete("/api/friends/:userId/:friendId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const friendId = parseInt(req.params.friendId);
      await storage.removeFriend(userId, friendId);
      res.json({ success: true });
    } catch (error) {
      console.error("Remove friend error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // Количество друзей
  app.get("/api/friends/:userId/count", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const count = await storage.getFriendsCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Get friends count error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // ========== ПОДАРКИ ==========

  // Получить все типы подарков
  app.get("/api/gifts/types", async (_req: Request, res: Response) => {
    try {
      const types = await storage.getAllGiftTypes();
      res.json(types);
    } catch (error) {
      console.error("Get gift types error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // Создать тип подарка (админ)
  app.post("/api/gifts/types", async (req: Request, res: Response) => {
    try {
      const { name, emoji, price, rarity, description } = req.body;
      if (!name || !emoji || price === undefined) {
        return res.status(400).json({ error: "name, emoji и price обязательны" });
      }
      const giftType = await storage.createGiftType({
        name, emoji, price, rarity: rarity || "common", description
      });
      res.json(giftType);
    } catch (error) {
      console.error("Create gift type error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // Отправить подарок
  app.post("/api/gifts/send", async (req: Request, res: Response) => {
    try {
      const { senderId, receiverId, giftTypeId, message, isAnonymous } = req.body;
      if (!senderId || !receiverId || !giftTypeId) {
        return res.status(400).json({ error: "senderId, receiverId и giftTypeId обязательны" });
      }
      const sentGift = await storage.sendGift(senderId, receiverId, giftTypeId, message, isAnonymous);
      res.json(sentGift);
    } catch (error) {
      console.error("Send gift error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // Получить полученные подарки
  app.get("/api/gifts/received/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const gifts = await storage.getReceivedGifts(userId);
      res.json(gifts);
    } catch (error) {
      console.error("Get received gifts error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // Получить отправленные подарки
  app.get("/api/gifts/sent/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const gifts = await storage.getSentGifts(userId);
      res.json(gifts);
    } catch (error) {
      console.error("Get sent gifts error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // Открыть подарок
  app.post("/api/gifts/:giftId/open", async (req: Request, res: Response) => {
    try {
      const giftId = parseInt(req.params.giftId);
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "userId обязателен" });
      }
      const gift = await storage.openGift(giftId, userId);
      res.json(gift);
    } catch (error) {
      console.error("Open gift error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // Количество подарков
  app.get("/api/gifts/:userId/count", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const count = await storage.getGiftsCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Get gifts count error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // ============== ACHIEVEMENTS API ==============
  
  // Получить все типы достижений
  app.get("/api/achievements/types", async (_req: Request, res: Response) => {
    try {
      const types = await storage.getAllAchievementTypes();
      res.json(types);
    } catch (error) {
      console.error("Get achievement types error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // Получить прогресс достижений пользователя
  app.get("/api/achievements/progress/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const progress = await storage.getUserAchievementProgress(userId);
      res.json(progress);
    } catch (error) {
      console.error("Get achievement progress error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // Получить выполненные достижения пользователя
  app.get("/api/achievements/completed/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const completed = await storage.getCompletedAchievements(userId);
      res.json(completed);
    } catch (error) {
      console.error("Get completed achievements error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // Обновить прогресс достижения
  app.post("/api/achievements/progress", async (req: Request, res: Response) => {
    try {
      const { userId, achievementTypeId, increment } = req.body;
      if (!userId || !achievementTypeId) {
        return res.status(400).json({ error: "userId и achievementTypeId обязательны" });
      }
      const result = await storage.updateAchievementProgress(userId, achievementTypeId, increment || 1);
      res.json(result);
    } catch (error) {
      console.error("Update achievement progress error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // Инициализировать достижения для пользователя
  app.post("/api/achievements/init/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      await storage.initUserAchievements(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Init achievements error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // ============== PARENT PORTAL API ==============

  // Привязать родителя к ребёнку
  app.post("/api/parent/link", async (req: Request, res: Response) => {
    try {
      const { parentId, childCode } = req.body;
      if (!parentId || !childCode) {
        return res.status(400).json({ error: "parentId и childCode обязательны" });
      }

      // Ищем ребёнка по коду
      const child = await storage.findChildByCode(childCode);
      if (!child) {
        return res.status(404).json({ error: "Ребёнок с таким кодом не найден" });
      }

      const link = await storage.linkParentToChild(parentId, child.id);
      res.json({ 
        success: true, 
        link,
        childName: `${child.firstName} ${child.lastName}`,
        verificationCode: link.verificationCode,
        message: `Запрос отправлен. Код подтверждения: ${link.verificationCode}`
      });
    } catch (error) {
      console.error("Link parent error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // Подтвердить привязку (ребёнок подтверждает)
  app.post("/api/parent/approve", async (req: Request, res: Response) => {
    try {
      const { linkId } = req.body;
      if (!linkId) {
        return res.status(400).json({ error: "linkId обязателен" });
      }
      const link = await storage.approveParentLink(linkId);
      res.json({ success: true, link });
    } catch (error) {
      console.error("Approve parent link error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // Отклонить привязку
  app.post("/api/parent/reject", async (req: Request, res: Response) => {
    try {
      const { linkId } = req.body;
      if (!linkId) {
        return res.status(400).json({ error: "linkId обязателен" });
      }
      await storage.rejectParentLink(linkId);
      res.json({ success: true });
    } catch (error) {
      console.error("Reject parent link error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // Получить детей родителя
  app.get("/api/parent/children/:parentId", async (req: Request, res: Response) => {
    try {
      const parentId = parseInt(req.params.parentId);
      const children = await storage.getChildrenByParent(parentId);
      res.json(children);
    } catch (error) {
      console.error("Get children error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // Получить запросы на привязку для ребёнка
  app.get("/api/parent/requests/:childId", async (req: Request, res: Response) => {
    try {
      const childId = parseInt(req.params.childId);
      const requests = await storage.getPendingParentRequests(childId);
      res.json(requests);
    } catch (error) {
      console.error("Get parent requests error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // Получить оценки ребёнка для родителя
  app.get("/api/parent/grades/:childId", async (req: Request, res: Response) => {
    try {
      const childId = parseInt(req.params.childId);
      const grades = await storage.getChildGradesForParent(childId);
      res.json(grades);
    } catch (error) {
      console.error("Get child grades error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // ============== HOMEWORK API ==============

  // Получить домашние задания для класса
  app.get("/api/homework/class/:classId", async (req: Request, res: Response) => {
    try {
      const classId = parseInt(req.params.classId);
      const homeworkList = await storage.getHomeworkByClassWithDetails(classId);
      res.json(homeworkList);
    } catch (error) {
      console.error("Get homework error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // Создать домашнее задание (учитель)
  app.post("/api/homework", async (req: Request, res: Response) => {
    try {
      const { subjectId, classId, title, description, dueDate, teacherId } = req.body;
      if (!subjectId || !classId || !title || !dueDate) {
        return res.status(400).json({ error: "subjectId, classId, title и dueDate обязательны" });
      }

      const hw = await storage.createHomeworkWithTeacher({
        subjectId,
        classId,
        title,
        description,
        dueDate,
        teacherId,
      });
      res.json(hw);
    } catch (error) {
      console.error("Create homework error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // Обновить домашнее задание
  app.put("/api/homework/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { title, description, dueDate } = req.body;
      const updated = await storage.updateHomework(id, { title, description, dueDate });
      res.json(updated);
    } catch (error) {
      console.error("Update homework error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // Удалить домашнее задание
  app.delete("/api/homework/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteHomework(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete homework error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // Сдать домашнее задание (ученик)
  app.post("/api/homework/:id/submit", async (req: Request, res: Response) => {
    try {
      const homeworkId = parseInt(req.params.id);
      const { studentId, content, photoUrl } = req.body;
      if (!studentId) {
        return res.status(400).json({ error: "studentId обязателен" });
      }

      // Проверяем, не сдал ли уже
      const existing = await storage.getHomeworkSubmission(homeworkId, studentId);
      if (existing) {
        return res.status(400).json({ error: "Вы уже сдали это задание" });
      }

      const submission = await storage.createHomeworkSubmission({
        homeworkId,
        studentId,
        content,
        photoUrl,
      });
      res.json(submission);
    } catch (error) {
      console.error("Submit homework error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // Получить сданные работы (для учителя)
  app.get("/api/homework/:id/submissions", async (req: Request, res: Response) => {
    try {
      const homeworkId = parseInt(req.params.id);
      const submissions = await storage.getHomeworkSubmissionsByHomework(homeworkId);
      res.json(submissions);
    } catch (error) {
      console.error("Get submissions error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // Оценить работу (учитель)
  app.post("/api/homework/submission/:id/grade", async (req: Request, res: Response) => {
    try {
      const submissionId = parseInt(req.params.id);
      const { grade, feedback } = req.body;
      if (!grade) {
        return res.status(400).json({ error: "grade обязательна" });
      }

      const updated = await storage.gradeHomeworkSubmission(submissionId, grade, feedback);
      res.json(updated);
    } catch (error) {
      console.error("Grade submission error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });
  
  // Инициализируем WebSocket сервер
  setupWebSocket(httpServer);

function generateInviteCode(role: string, classId?:  number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  if (classId) {
    return `CLASS${classId}-${suffix}`;
  }
  
  const prefix = role.toUpperCase().substring(0, 4);
  return `${prefix}-${suffix}`;
}

  // Загрузить файл (фото, видео)
  app.post("/api/upload", upload.single("file"), async (req: Request, res: Response) => {
    try {
      const file = (req as any).file;
      if (!file) {
        return res.status(400).json({ error: "Файл не загружен" });
      }

      const fileUrl = `/uploads/${file.filename}`;
      
      res.json({
        success: true,
        fileName: file.originalname,
        fileUrl,
        fileSize: file.size,
        mimeType: file.mimetype,
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Ошибка загрузки файла" });
    }
  });

  // Статическая раздача загруженных файлов
  app.use("/uploads", (req, res, next) => {
    // Проверяем, что файл существует в папке uploads
    const filePath = path.join(uploadDir, path.basename(req.path));
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ error: "Файл не найден" });
    }
  });

  // Админ-панель для управления инвайт-кодами
  app.get("/admin", (_req: Request, res: Response) => {
    const adminPanelPath = path.join(__dirname, "templates", "admin-panel.html");
    if (fs.existsSync(adminPanelPath)) {
      res.sendFile(adminPanelPath);
    } else {
      res.status(404).send("Админ-панель не найдена");
    }
  });

  // ==================== JWT AUTH API ====================

  // Обновить токены
  app.post("/api/auth/refresh", async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ error: "Refresh token обязателен" });
      }

      const tokens = await refreshTokens(refreshToken);
      if (!tokens) {
        return res.status(401).json({ error: "Недействительный refresh token" });
      }

      res.json(tokens);
    } catch (error) {
      console.error("Token refresh error:", error);
      res.status(500).json({ error: "Ошибка обновления токена" });
    }
  });

  // Выход (отзыв сессии)
  app.post("/api/auth/logout", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        await revokeSession(refreshToken);
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Ошибка выхода" });
    }
  });

  // Выход со всех устройств
  app.post("/api/auth/logout-all", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Не авторизован" });
      }
      await revokeAllUserSessions(req.userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Logout all error:", error);
      res.status(500).json({ error: "Ошибка выхода" });
    }
  });

  // Получить активные сессии
  app.get("/api/auth/sessions", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Не авторизован" });
      }
      const sessions = await storage.getUserActiveSessions(req.userId);
      res.json(sessions.map(s => ({
        id: s.id,
        deviceInfo: s.deviceInfo,
        lastUsedAt: s.lastUsedAt,
        createdAt: s.createdAt,
      })));
    } catch (error) {
      console.error("Get sessions error:", error);
      res.status(500).json({ error: "Ошибка получения сессий" });
    }
  });

  // ==================== СЕРВЕРНЫЙ БАЛАНС ЗВЁЗД ====================

  // Получить баланс звёзд
  app.get("/api/stars/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const stars = await storage.getOrCreateUserStars(userId);
      res.json({
        balance: stars.balance,
        totalEarned: stars.totalEarned,
        totalSpent: stars.totalSpent,
      });
    } catch (error) {
      console.error("Get stars error:", error);
      res.status(500).json({ error: "Ошибка получения баланса" });
    }
  });

  // Добавить звёзды (для заработка через активности)
  app.post("/api/stars/earn", async (req: Request, res: Response) => {
    try {
      const { userId, amount, type, reason, relatedId } = req.body;
      if (!userId || !amount || !type) {
        return res.status(400).json({ error: "userId, amount и type обязательны" });
      }

      const result = await storage.addStars(userId, amount, type, reason, relatedId);
      res.json({ 
        success: true, 
        newBalance: result.newBalance,
        transaction: result.transaction 
      });
    } catch (error) {
      console.error("Earn stars error:", error);
      res.status(500).json({ error: "Ошибка начисления звёзд" });
    }
  });

  // Потратить звёзды (покупка подарков и др.)
  app.post("/api/stars/spend", async (req: Request, res: Response) => {
    try {
      const { userId, amount, type, reason, relatedId } = req.body;
      if (!userId || !amount || !type) {
        return res.status(400).json({ error: "userId, amount и type обязательны" });
      }

      const result = await storage.spendStars(userId, amount, type, reason, relatedId);
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({ 
        success: true, 
        newBalance: result.newBalance,
        transaction: result.transaction 
      });
    } catch (error) {
      console.error("Spend stars error:", error);
      res.status(500).json({ error: "Ошибка списания звёзд" });
    }
  });

  // CEO покупка звёзд (бесплатно)
  app.post("/api/stars/ceo-buy", async (req: Request, res: Response) => {
    try {
      const { userId, amount } = req.body;
      if (!userId || !amount) {
        return res.status(400).json({ error: "userId и amount обязательны" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== 'ceo') {
        return res.status(403).json({ error: "Только CEO может использовать этот эндпоинт" });
      }

      const result = await storage.addStars(userId, amount, 'ceo_purchase', `CEO покупка ${amount} звёзд`);
      res.json({ 
        success: true, 
        newBalance: result.newBalance 
      });
    } catch (error) {
      console.error("CEO buy stars error:", error);
      res.status(500).json({ error: "Ошибка покупки звёзд" });
    }
  });

  // История транзакций звёзд
  app.get("/api/stars/:userId/transactions", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const limit = parseInt(req.query.limit as string) || 50;
      const transactions = await storage.getStarTransactions(userId, limit);
      res.json(transactions);
    } catch (error) {
      console.error("Get transactions error:", error);
      res.status(500).json({ error: "Ошибка получения истории" });
    }
  });

  return httpServer;
}