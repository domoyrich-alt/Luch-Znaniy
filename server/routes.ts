import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { inviteCode, role, firstName, lastName } = req.body;

      if (!inviteCode || !role) {
        return res.status(400).json({ error: "Код приглашения и роль обязательны" });
      }

      if (!firstName || !firstName.trim()) {
        return res.status(400).json({ error: "Имя обязательно" });
      }

      if (!lastName || !lastName.trim()) {
        return res.status(400).json({ error: "Фамилия обязательна" });
      }

      const validation = await storage.validateInviteCode(inviteCode.toUpperCase(), role);
      
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }

      const user = await storage.createUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role,
        classId: validation.classId || null,
        inviteCode: inviteCode.toUpperCase(),
      });

      res.json({
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          classId: user.classId,
          className: validation.className,
        }
      });

    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.get("/api/verify-code/:code", async (req: Request, res: Response) => {
    try {
      const { code } = req.params;
      const inviteCode = await storage.getInviteCode(code.toUpperCase());

      if (!inviteCode || !inviteCode.isActive) {
        return res.status(404).json({ error: "Код не найден или неактивен" });
      }

      let className = "";
      if (inviteCode.classId) {
        const classData = await storage.getClass(inviteCode.classId);
        if (classData) {
          className = `${classData.grade}${classData.name}`;
        }
      }

      res.json({
        valid: true,
        role: inviteCode.role,
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

  app.get("/api/class/:classId/students", async (req: Request, res: Response) => {
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
            todayStatus: attendance?.status || "absent",
          };
        })
      );
      
      res.json(studentsWithAttendance);
    } catch (error) {
      console.error("Get class students error:", error);
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

  app.get("/api/grades/:studentId", async (req: Request, res: Response) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const grades = await storage.getGradesByStudent(studentId);
      const averageGrade = await storage.getAverageGradeByStudent(studentId);
      res.json({ grades, averageGrade: Math.round(averageGrade * 100) / 100 });
    } catch (error) {
      console.error("Get grades error:", error);
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
      const { studentId, subjectId, grade, date, comment, teacherId } = req.body;
      
      if (!studentId || !subjectId || !grade || !date) {
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

  app.post("/api/homework", async (req: Request, res: Response) => {
    try {
      const { subjectId, classId, title, description, dueDate, teacherId } = req.body;

      if (!subjectId || !classId || !title || !dueDate) {
        return res.status(400).json({ error: "Обязательные поля: предмет, класс, название, дата сдачи" });
      }

      const homework = await storage.createHomework({
        subjectId,
        classId,
        title,
        description,
        dueDate,
        teacherId,
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
      const homeworkId = parseInt(req.params.homeworkId);
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
      const isEvenWeek = req.query.isEvenWeek === "true" ? true : req.query.isEvenWeek === "false" ? false : undefined;
      const schedule = await storage.getScheduleByClass(classId, isEvenWeek);
      res.json(schedule);
    } catch (error) {
      console.error("Get schedule error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.post("/api/schedule", async (req: Request, res: Response) => {
    try {
      const { classId, subjectId, teacherId, dayOfWeek, startTime, endTime, room, isEvenWeek } = req.body;

      if (!classId || !subjectId || dayOfWeek === undefined || !startTime || !endTime) {
        return res.status(400).json({ error: "Обязательные поля: класс, предмет, день недели, время начала и конца" });
      }

      const item = await storage.createScheduleItem({
        classId,
        subjectId,
        teacherId,
        dayOfWeek,
        startTime,
        endTime,
        room,
        isEvenWeek,
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
        type: type || "event",
        classId,
        createdById,
      });

      res.json(event);
    } catch (error) {
      console.error("Create event error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.put("/api/events/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateEvent(id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Мероприятие не найдено" });
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
      const newsList = await storage.getNews();
      res.json(newsList);
    } catch (error) {
      console.error("Get news error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.post("/api/news", async (req: Request, res: Response) => {
    try {
      const { title, content, imageUrl, isImportant, createdById } = req.body;

      if (!title || !content) {
        return res.status(400).json({ error: "Заголовок и содержание обязательны" });
      }

      const newsItem = await storage.createNews({
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

  app.put("/api/news/:id", async (req: Request, res: Response) => {
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

      if (!name || !price || !category) {
        return res.status(400).json({ error: "Название, цена и категория обязательны" });
      }

      const item = await storage.createCafeteriaMenuItem({
        name,
        description,
        price: price.toString(),
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

  app.put("/api/cafeteria/:id", async (req: Request, res: Response) => {
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
      await storage.deleteCafeteriaMenuItem(id);
      res.json({ message: "Удалено" });
    } catch (error) {
      console.error("Delete cafeteria item error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.get("/api/attendance/:studentId", async (req: Request, res: Response) => {
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

      if (!studentId || !date || !status) {
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

  app.get("/api/chat/:homeworkId", async (req: Request, res: Response) => {
    try {
      const homeworkId = parseInt(req.params.homeworkId);
      const messages = await storage.getChatMessages(homeworkId);
      res.json(messages);
    } catch (error) {
      console.error("Get chat error:", error);
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

  app.post("/api/invite-codes", async (req: Request, res: Response) => {
    try {
      const { role, classId, createdById, maxUses } = req.body;

      if (!role || !createdById) {
        return res.status(400).json({ error: "Роль и создатель обязательны" });
      }

      const code = generateInviteCode(role, classId);
      
      const inviteCode = await storage.createInviteCode({
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

  app.get("/api/leaderboard/:level", async (req: Request, res: Response) => {
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
          return res.status(400).json({ error: "Неверный уровень. Используйте: junior, middle, senior" });
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
      const classId = parseInt(req.params.classId);
      const messages = await storage.getClassChatMessages(classId);
      
      const messagesWithUsers = await Promise.all(
        messages.map(async (msg: any) => {
          const sender = await storage.getUser(msg.senderId);
          return {
            ...msg,
            senderName: sender ? `${sender.firstName} ${sender.lastName}`.trim() : "Неизвестный",
          };
        })
      );
      
      res.json(messagesWithUsers);
    } catch (error) {
      console.error("Get class chat error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.post("/api/class-chat/:classId", async (req: Request, res: Response) => {
    try {
      const classId = parseInt(req.params.classId);
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

  app.post("/api/achievements/:studentId/calculate", async (req: Request, res: Response) => {
    try {
      const studentId = parseInt(req.params.studentId);
      
      const user = await storage.getUser(studentId);
      if (!user) {
        return res.status(404).json({ error: "Пользователь не найден" });
      }

      const gradesList = await storage.getGradesByStudent(studentId);
      const averageGrade = await storage.getAverageGradeByStudent(studentId);
      
      const existingAchievements = await storage.getAchievementsByStudent(studentId);
      const existingTypes = new Set(existingAchievements.map(a => a.type));
      
      const newAchievements: { type: string; title: string; description: string; progress: number }[] = [];
      
      if (averageGrade >= 4.5 && !existingTypes.has("excellent_grades")) {
        const progress = Math.min(100, Math.round((averageGrade / 5) * 100));
        newAchievements.push({
          type: "excellent_grades",
          title: "Отличник",
          description: "Средний балл 4.5 или выше",
          progress,
        });
      }
      
      if (gradesList.length >= 10 && !existingTypes.has("homework_champion")) {
        const progress = Math.min(100, gradesList.length * 2);
        newAchievements.push({
          type: "homework_champion",
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
          progress: achievement.progress,
        });
      }
      
      const updatedAchievements = await storage.getAchievementsByStudent(studentId);
      res.json(updatedAchievements);
    } catch (error) {
      console.error("Calculate achievements error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  const httpServer = createServer(app);

function generateInviteCode(role: string, classId?: number): string {
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

  return httpServer;
}
