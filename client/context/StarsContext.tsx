import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/context/AuthContext';
import { apiGet, apiPost } from '@/lib/api';

interface Achievement {
  id:  string;
  title: string;
  description: string;
  emoji: string;
  stars: number;
  unlocked: boolean;
  progress?:  number;
  maxProgress?: number;
}

interface StarTransaction {
  id: number;
  amount: number;
  type: string;
  reason?: string;
  balanceAfter: number;
  createdAt: string;
}

interface StarsContextType {
  stars: number;
  totalEarned: number;
  totalSpent: number;
  achievements:  Achievement[];
  transactions: StarTransaction[];
  isLoading: boolean;
  earnStars: (amount: number, type: string, reason?: string) => Promise<boolean>;
  spendStars: (amount: number, type: string, reason?: string) => Promise<boolean>;
  ceoBuyStars: (amount: number) => Promise<boolean>;
  checkAchievements: () => void;
  refreshBalance: () => Promise<void>;
}

const LOCAL_STORAGE_KEY = '@luch_znaniy_stars_v1';

const ACHIEVEMENTS:  Achievement[] = [
  { id: 'first_5', title: 'Первая пятерка', description: 'Получите первую оценку 5', emoji: '⭐', stars:  5, unlocked: false },
  { id: 'straight_a', title: 'Отличник', description: 'Получите 10 пятерок подряд', emoji:  '🏆', stars: 50, unlocked: false, progress: 0, maxProgress: 10 },
  { id: 'homework_master', title: 'Мастер домашки', description:  'Сдайте 20 домашних заданий', emoji:  '📚', stars: 30, unlocked: false, progress: 0, maxProgress: 20 },
  { id: 'social_butterfly', title: 'Социальная бабочка', description:  'Отправьте 5 подарков', emoji: '🎁', stars: 25, unlocked: false, progress: 0, maxProgress: 5 },
];

const StarsContext = createContext<StarsContextType | undefined>(undefined);

export function StarsProvider({ children }: { children:  ReactNode }) {
  const [stars, setStars] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [achievements, setAchievements] = useState(ACHIEVEMENTS);
  const [transactions, setTransactions] = useState<StarTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Загрузка баланса с сервера
  const refreshBalance = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const data = await apiGet<{ balance: number; totalEarned: number; totalSpent: number }>(`api/stars/${user.id}`);
      if (data) {
        setStars(data.balance);
        setTotalEarned(data.totalEarned);
        setTotalSpent(data.totalSpent);
        
        // Сохраняем локально для offline доступа
        await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
          stars: data.balance,
          totalEarned: data.totalEarned,
          totalSpent: data.totalSpent,
          achievements,
        }));
      }
    } catch (error) {
      console.log('[Stars] Failed to refresh from server, using local cache');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, achievements]);

  // Загрузка при монтировании
  useEffect(() => {
    const loadInitial = async () => {
      // Сначала загружаем из локального кеша
      try {
        const raw = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (typeof parsed?.stars === 'number') setStars(parsed.stars);
          if (typeof parsed?.totalEarned === 'number') setTotalEarned(parsed.totalEarned);
          if (typeof parsed?.totalSpent === 'number') setTotalSpent(parsed.totalSpent);
          if (Array.isArray(parsed?.achievements)) setAchievements(parsed.achievements);
        }
      } catch {
        // ignore
      }
      
      // Затем синхронизируем с сервером
      if (user?.id) {
        await refreshBalance();
      }
    };
    
    loadInitial();
  }, [user?.id]);

  // Заработать звёзды (через сервер)
  const earnStars = useCallback(async (amount: number, type: string, reason?: string): Promise<boolean> => {
    if (!user?.id || !Number.isFinite(amount) || amount <= 0) return false;
    
    try {
      const result = await apiPost<{ success: boolean; newBalance: number }>('api/stars/earn', {
        userId: user.id,
        amount,
        type,
        reason,
      });
      
      if (result?.success) {
        setStars(result.newBalance);
        setTotalEarned(prev => prev + amount);
        console.log(`[Stars] Заработано ${amount} звёзд за: ${reason || type}`);
        return true;
      }
    } catch (error) {
      console.error('[Stars] Earn failed:', error);
    }
    return false;
  }, [user?.id]);

  // Потратить звёзды (через сервер)
  const spendStars = useCallback(async (amount: number, type: string, reason?: string): Promise<boolean> => {
    if (!user?.id) return false;
    
    // CEO всегда может - оптимистично
    if (user.role === 'ceo') {
      // Сервер обработает CEO бесплатно
    }
    
    try {
      const result = await apiPost<{ success: boolean; newBalance: number; error?: string }>('api/stars/spend', {
        userId: user.id,
        amount,
        type,
        reason,
      });
      
      if (result?.success) {
        setStars(result.newBalance);
        if (user.role !== 'ceo') {
          setTotalSpent(prev => prev + amount);
        }
        return true;
      }
      
      console.log('[Stars] Spend failed:', result?.error);
      return false;
    } catch (error) {
      console.error('[Stars] Spend failed:', error);
      return false;
    }
  }, [user?.id, user?.role]);

  // CEO покупка звёзд (бесплатно)
  const ceoBuyStars = useCallback(async (amount: number): Promise<boolean> => {
    if (!user?.id || user.role !== 'ceo') return false;
    
    try {
      const result = await apiPost<{ success: boolean; newBalance: number }>('api/stars/ceo-buy', {
        userId: user.id,
        amount,
      });
      
      if (result?.success) {
        setStars(result.newBalance);
        setTotalEarned(prev => prev + amount);
        console.log(`[Stars] CEO купил ${amount} звёзд`);
        return true;
      }
    } catch (error) {
      console.error('[Stars] CEO buy failed:', error);
    }
    return false;
  }, [user?.id, user?.role]);

  const checkAchievements = () => {
    // TODO: можно расширить прогресс достижений по событиям приложения
  };

  const value = useMemo(
    () => ({ 
      stars, 
      totalEarned,
      totalSpent,
      achievements, 
      transactions,
      isLoading,
      earnStars, 
      spendStars, 
      ceoBuyStars,
      checkAchievements,
      refreshBalance,
    }),
    [stars, totalEarned, totalSpent, achievements, transactions, isLoading, earnStars, spendStars, ceoBuyStars, refreshBalance]
  );

  return <StarsContext.Provider value={value}>{children}</StarsContext.Provider>;
}

export const useStars = () => {
  const context = useContext(StarsContext);
  if (!context) throw new Error('useStars must be used within StarsProvider');
  return context;
};