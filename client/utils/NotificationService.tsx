import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Настройка поведения уведомлений
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface NotificationData {
  type: 'gift' | 'grade' | 'homework' | 'announcement' | 'star_bonus';
  [key: string]: any;
}

export class NotificationService {
  private static expoPushToken: string | null = null;

  // Регистрация для push-уведомлений
  static async registerForPushNotificationsAsync(): Promise<string | null> {
    let token: string | null = null;

    if (Platform. OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance:  Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
      });

      // Создаем специальные каналы
      await Notifications. setNotificationChannelAsync('gifts', {
        name: 'Подарки',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
        description: 'Уведомления о подарках',
      });

      await Notifications.setNotificationChannelAsync('grades', {
        name: 'Оценки',
        importance: Notifications. AndroidImportance. DEFAULT,
        sound: 'default',
        description: 'Уведомления об оценках',
      });
    }

    if (Device.isDevice) {
      const { status:  existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        alert('Разрешите уведомления для получения подарков и новостей!  🎁');
        return null;
      }
      
      token = (await Notifications.getExpoPushTokenAsync()).data;
      this.expoPushToken = token;
    } else {
      alert('Нужно физическое устройство для push уведомлений');
    }

    return token;
  }

  // Отправка локального уведомления
  static async sendLocalNotification(
    title: string, 
    body:  string, 
    data?: NotificationData,
    channelId = 'default'
  ) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
        priority: Notifications. AndroidNotificationPriority.HIGH,
        vibrate: [0, 250, 250, 250],
      },
      trigger:  null,
      identifier: `notification_${Date.now()}`,
    });
  }

  // Отправка уведомления о подарке
  static async sendGiftNotification(
    giftName: string,
    senderName: string, 
    senderRole: string,
    message?:  string
  ) {
    const roleEmoji = this.getRoleEmoji(senderRole);
    
    await this.sendLocalNotification(
      `🎁 Новый подарок:  ${giftName}! `,
      `${roleEmoji} ${senderName} отправил вам подарок!${message ?  `\n💌 "${message}"` : ''}`,
      { 
        type: 'gift', 
        giftName, 
        senderName, 
        senderRole,
        message 
      },
      'gifts'
    );
  }

  // Уведомление о новой оценке
  static async sendGradeNotification(subject: string, grade:  number, stars: number) {
    const gradeEmoji = grade >= 5 ? '🌟' : grade >= 4 ? '⭐' : grade >= 3 ?  '📝' : '📉';
    
    await this.sendLocalNotification(
      `${gradeEmoji} Новая оценка:  ${grade}`,
      `${subject}:  получена оценка ${grade}! Заработано ${stars} звезд ⭐`,
      { type: 'grade', subject, grade, stars },
      'grades'
    );
  }

  // Уведомление о домашнем задании
  static async sendHomeworkNotification(subject: string, deadline: string) {
    await this.sendLocalNotification(
      `📚 Новое домашнее задание`,
      `${subject}: сдать до ${deadline}`,
      { type:  'homework', subject, deadline }
    );
  }

  // Ежедневный бонус звезд
  static async sendDailyStarBonus(stars: number) {
    await this.sendLocalNotification(
      `🎉 Ежедневный бонус! `,
      `Получите ${stars} звезд за вход в приложение! `,
      { type: 'star_bonus', stars }
    );
  }

  // Уведомление от администрации
  static async sendAdminAnnouncement(title: string, message:  string) {
    await this.sendLocalNotification(
      `📢 Объявление:  ${title}`,
      message,
      { type: 'announcement', title, message }
    );
  }

  // Запланировать ежедневные уведомления
  static async scheduleDailyReminders() {
    // Утренняя мотивация (8:00)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌅 Доброе утро!',
        body: 'Новый день - новые возможности заработать звезды!  ⭐',
        data: { type: 'daily_motivation' },
      },
      trigger:  {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: 8,
        minute: 0,
        repeats: true,
      },
    });

    // Напоминание о домашке (19:00)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📚 Напоминание',
        body: 'Не забудьте выполнить домашние задания!',
        data: { type: 'homework_reminder' },
      },
      trigger:  {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour:  19,
        minute: 0,
        repeats:  true,
      },
    });
  }

  // Отменить все уведомления
  static async cancelAllNotifications() {
    await Notifications. cancelAllScheduledNotificationsAsync();
  }

  // Получить токен
  static getToken(): string | null {
    return this.expoPushToken;
  }

  private static getRoleEmoji(role: string): string {
    switch (role) {
      case 'ceo':  return '👑';
      case 'director': return '🎯';
      case 'teacher': return '👨‍🏫';
      case 'curator': return '🛡️';
      case 'cook': return '👨‍🍳';
      default: return '👤';
    }
  }
}

// Удобные функции-обертки
export const sendNotification = NotificationService.sendLocalNotification;
export const sendGiftNotification = NotificationService.sendGiftNotification;
export const sendGradeNotification = NotificationService.sendGradeNotification;
export const registerNotifications = NotificationService. registerForPushNotificationsAsync;
export const scheduleDailyStarBonus = NotificationService.scheduleDailyReminders;