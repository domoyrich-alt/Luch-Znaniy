import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

interface StarsContextType {
  stars: number;
  achievements:  Achievement[];
  earnStars: (amount: number, reason:  string) => void;
  spendStars: (amount: number) => boolean;
  checkAchievements: () => void;
}

const STORAGE_KEY = '@luch_znaniy_stars_v1';

const ACHIEVEMENTS:  Achievement[] = [
  { id: 'first_5', title: 'Первая пятерка', description: 'Получите первую оценку 5', emoji: '⭐', stars:  5, unlocked: false },
  { id: 'straight_a', title: 'Отличник', description: 'Получите 10 пятерок подряд', emoji:  '🏆', stars: 50, unlocked: false, progress: 0, maxProgress: 10 },
  { id: 'homework_master', title: 'Мастер домашки', description:  'Сдайте 20 домашних заданий', emoji:  '📚', stars: 30, unlocked: false, progress: 0, maxProgress: 20 },
  { id: 'social_butterfly', title: 'Социальная бабочка', description:  'Отправьте 5 подарков', emoji: '🎁', stars: 25, unlocked: false, progress: 0, maxProgress: 5 },
];

const StarsContext = createContext<StarsContextType | undefined>(undefined);

export function StarsProvider({ children }: { children:  ReactNode }) {
  const [stars, setStars] = useState(0);
  const [achievements, setAchievements] = useState(ACHIEVEMENTS);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (typeof parsed?.stars === 'number') setStars(parsed.stars);
        if (Array.isArray(parsed?.achievements)) setAchievements(parsed.achievements);
      } catch {
        // ignore
      }
    };
    load();
  }, []);

  useEffect(() => {
    const save = async () => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ stars, achievements })
        );
      } catch {
        // ignore
      }
    };
    save();
  }, [stars, achievements]);

  const earnStars = (amount: number, reason: string) => {
    if (!Number.isFinite(amount) || amount <= 0) return;
    setStars(prev => prev + amount);
    console.log(`Заработано ${amount} звезд за: ${reason}`);
  };

  const spendStars = (amount: number): boolean => {
    if (stars >= amount) {
      setStars(prev => prev - amount);
      return true;
    }
    return false;
  };

  const checkAchievements = () => {
    // TODO: можно расширить прогресс достижений по событиям приложения
  };

  const value = useMemo(
    () => ({ stars, achievements, earnStars, spendStars, checkAchievements }),
    [stars, achievements]
  );

  return <StarsContext.Provider value={value}>{children}</StarsContext.Provider>;
}

export const useStars = () => {
  const context = useContext(StarsContext);
  if (!context) throw new Error('useStars must be used within StarsProvider');
  return context;
};