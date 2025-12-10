import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "node:http";
import { db } from "./db";
import { directors, inviteCodes } from "@shared/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import path from "path";

function generateDirectorKey(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let key = "DIR-";
  for (let i = 0; i < 8; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

function generateInviteCode(className: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = className.toUpperCase().replace(/\s/g, "") + "-";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const TOKEN_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");

function hashPassword(password: string, salt?: string): string {
  const useSalt = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, useSalt, 10000, 64, "sha512").toString("hex");
  return `${useSalt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return hash === verifyHash;
}

function generateToken(userId: string): string {
  const payload = { userId, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 };
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", TOKEN_SECRET).update(payloadBase64).digest("base64url");
  return `${payloadBase64}.${signature}`;
}

function verifyToken(token: string): string | null {
  try {
    const [payloadBase64, signature] = token.split(".");
    if (!payloadBase64 || !signature) return null;
    
    const expectedSignature = crypto.createHmac("sha256", TOKEN_SECRET).update(payloadBase64).digest("base64url");
    if (signature !== expectedSignature) return null;
    
    const payload = JSON.parse(Buffer.from(payloadBase64, "base64url").toString());
    if (payload.exp < Date.now()) return null;
    return payload.userId;
  } catch {
    return null;
  }
}

interface AuthRequest extends Request {
  directorId?: string;
}

async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Требуется авторизация" });
  }

  const token = authHeader.substring(7);
  const directorId = verifyToken(token);
  
  if (!directorId) {
    return res.status(401).json({ error: "Недействительный токен" });
  }

  req.directorId = directorId;
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/admin", (_req, res) => {
    res.sendFile(path.join(process.cwd(), "server/templates/admin-panel.html"));
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { name, schoolName, email, password } = req.body;

      if (!name || !schoolName || !email || !password) {
        return res.status(400).json({ error: "Все поля обязательны" });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: "Пароль должен быть минимум 6 символов" });
      }

      const existing = await db.select().from(directors).where(eq(directors.email, email));
      if (existing.length > 0) {
        return res.status(400).json({ error: "Email уже зарегистрирован" });
      }

      const directorKey = generateDirectorKey();
      const hashedPassword = hashPassword(password);

      await db.insert(directors).values({
        name,
        schoolName,
        email,
        password: hashedPassword,
        directorKey,
      });

      res.json({ 
        message: "Регистрация успешна",
        directorKey 
      });

    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email и пароль обязательны" });
      }

      const result = await db.select().from(directors)
        .where(eq(directors.email, email));

      if (result.length === 0 || !verifyPassword(password, result[0].password)) {
        return res.status(401).json({ error: "Неверный email или пароль" });
      }

      const director = result[0];
      const token = generateToken(director.id);

      res.json({
        token,
        user: {
          id: director.id,
          name: director.name,
          email: director.email,
          schoolName: director.schoolName,
          directorKey: director.directorKey,
        }
      });

    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.get("/api/invite-codes", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const codes = await db.select().from(inviteCodes)
        .where(eq(inviteCodes.directorId, req.directorId!));

      res.json(codes);

    } catch (error) {
      console.error("Get codes error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.post("/api/invite-codes", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const { className, role } = req.body;

      if (!className || !role) {
        return res.status(400).json({ error: "Класс и роль обязательны" });
      }

      const validRoles = ["student", "teacher", "curator"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: "Неверная роль" });
      }

      const code = generateInviteCode(className);

      const result = await db.insert(inviteCodes).values({
        code,
        className,
        role,
        directorId: req.directorId!,
      }).returning();

      res.json(result[0]);

    } catch (error) {
      console.error("Create code error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.delete("/api/invite-codes/:id", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;

      const code = await db.select().from(inviteCodes)
        .where(eq(inviteCodes.id, id));

      if (code.length === 0 || code[0].directorId !== req.directorId) {
        return res.status(404).json({ error: "Код не найден" });
      }

      await db.delete(inviteCodes).where(eq(inviteCodes.id, id));

      res.json({ message: "Код удален" });

    } catch (error) {
      console.error("Delete code error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  app.get("/api/verify-code/:code", async (req, res) => {
    try {
      const { code } = req.params;

      const result = await db.select().from(inviteCodes)
        .where(eq(inviteCodes.code, code.toUpperCase()));

      if (result.length === 0 || !result[0].isActive) {
        return res.status(404).json({ error: "Код не найден или неактивен" });
      }

      const inviteCode = result[0];

      res.json({
        valid: true,
        className: inviteCode.className,
        role: inviteCode.role,
      });

    } catch (error) {
      console.error("Verify code error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
