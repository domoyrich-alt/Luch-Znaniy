/**
 * JWT AUTHENTICATION MODULE
 * 
 * Телеграм-стиль безопасности:
 * - Access token (короткий, 15 мин)
 * - Refresh token (длинный, 30 дней)
 * - Сессии в БД (можно отозвать)
 * - Проверка роли на сервере
 */

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { storage } from './storage';

// Секрет для JWT (в продакшене должен быть в .env)
const JWT_SECRET = process.env.JWT_SECRET || 'school-app-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'school-app-refresh-secret-change';

// Время жизни токенов
const ACCESS_TOKEN_EXPIRES = '15m';
const REFRESH_TOKEN_EXPIRES = '30d';
const REFRESH_TOKEN_EXPIRES_MS = 30 * 24 * 60 * 60 * 1000; // 30 дней в мс

// Payload токена
export interface TokenPayload {
  userId: number;
  role: string;
  sessionId?: number;
}

// Расширяем Request для типизации
export interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      userId?: number;
      userRole?: string;
    }
  }
}

/**
 * Генерация Access Token (короткий)
 */
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });
}

/**
 * Генерация Refresh Token (длинный, уникальный)
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

/**
 * Верификация Access Token
 */
export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Создание новой сессии в БД
 */
export async function createSession(
  userId: number,
  deviceInfo?: string,
  ipAddress?: string
): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date; expiresIn: number }> {
  const refreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS);
  
  // Получаем пользователя для роли
  const user = await storage.getUser(userId);
  if (!user) throw new Error('User not found');
  
  // Сохраняем сессию в БД
  const session = await storage.createUserSession({
    userId,
    refreshToken,
    deviceInfo: deviceInfo || 'Unknown',
    ipAddress: ipAddress || 'Unknown',
    expiresAt,
    isActive: true,
  });
  
  // Генерируем access token
  const accessToken = generateAccessToken({
    userId,
    role: user.role,
    sessionId: session.id,
  });
  
  return { accessToken, refreshToken, expiresAt, expiresIn: 900 }; // 15 минут в секундах
}

/**
 * Обновление токенов по refresh token
 */
export async function refreshTokens(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date } | null> {
  // Ищем сессию
  const session = await storage.getUserSessionByRefreshToken(refreshToken);
  if (!session || !session.isActive || new Date(session.expiresAt) < new Date()) {
    return null;
  }
  
  // Получаем пользователя
  const user = await storage.getUser(session.userId);
  if (!user) return null;
  
  // Ротация refresh token (безопаснее)
  const newRefreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS);
  
  await storage.updateUserSession(session.id, {
    refreshToken: newRefreshToken,
    expiresAt,
    lastUsedAt: new Date(),
  });
  
  // Новый access token
  const accessToken = generateAccessToken({
    userId: user.id,
    role: user.role,
    sessionId: session.id,
  });
  
  return { accessToken, refreshToken: newRefreshToken, expiresAt };
}

/**
 * Отзыв сессии (logout) по refresh token
 */
export async function revokeSession(refreshToken: string): Promise<void> {
  const session = await storage.getUserSessionByRefreshToken(refreshToken);
  if (session) {
    await storage.updateUserSession(session.id, { isActive: false });
  }
}

/**
 * Отзыв всех сессий пользователя
 */
export async function revokeAllUserSessions(userId: number): Promise<void> {
  await storage.revokeAllUserSessions(userId);
}

/**
 * Middleware: Проверка аутентификации
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }
  
  const token = authHeader.substring(7);
  const payload = verifyAccessToken(token);
  
  if (!payload) {
    return res.status(401).json({ error: 'Недействительный токен' });
  }
  
  req.user = payload;
  req.userId = payload.userId;
  req.userRole = payload.role;
  next();
}

/**
 * Middleware: Проверка роли
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Требуется авторизация' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }
    
    next();
  };
}

/**
 * Middleware: Только CEO
 */
export const requireCeo = requireRole('ceo');

/**
 * Middleware: Учителя и выше
 */
export const requireTeacherOrAbove = requireRole('teacher', 'curator', 'director', 'ceo');

/**
 * Middleware: Администраторы
 */
export const requireAdmin = requireRole('director', 'ceo');
