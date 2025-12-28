import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';

// ИСПРАВЛЕНО: убираем ./client/ и используем @/ алиасы
import { AuthProvider } from '@/context/AuthContext';
import { AppProvider } from '@/context/AppContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { StarsProvider } from '@/context/StarsContext';
import RootStackNavigator from '@/navigation/RootStackNavigator';
import { NotificationService } from '@/utils/NotificationService';
import { queryClient } from '@/lib/query-client';

export default function App() {
  useEffect(() => {
    // Регистрируем уведомления при запуске
    NotificationService.registerForPushNotificationsAsync();
    
    // Настраиваем ежедневные напоминания
    NotificationService.scheduleDailyReminders();

    console.log('📱 Приложение запущено! ');
  }, []);

  return (
    <SafeAreaProvider>
      <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <SettingsProvider>
              <AuthProvider>
                <AppProvider>
                  <StarsProvider>
                    <NavigationContainer>
                      <RootStackNavigator />
                    </NavigationContainer>
                  </StarsProvider>
                </AppProvider>
              </AuthProvider>
            </SettingsProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}