export const STAR_REWARDS = {
  // За оценки
  grade_5: { stars: 5, message: "Отличная работа! ⭐" },
  grade_4: { stars:  3, message: "Хорошо! ⭐" },  
  grade_3: { stars: 1, message: "Неплохо ⭐" },
  
  // За домашки
  homework_completed: { stars: 2, message: "Домашка сдана! ⭐" },
  homework_early: { stars: 5, message: "Сдано раньше срока! ⭐" },
  
  // За активность
  attendance_perfect_week: { stars: 20, message: "Неделя без пропусков! ⭐" },
  first_in_class: { stars: 3, message: "Первым пришел в класс! ⭐" },
  
  // За социальную активность  
  help_classmate: { stars: 5, message: "Помощь однокласснику! ⭐" },
  forum_post: { stars: 1, message: "Пост на форуме! ⭐" },
  
  // За достижения
  achievement_unlock: { stars: 25, message: "Новое достижение!  ⭐" },
};

export function earnStars(type: keyof typeof STAR_REWARDS, multiplier = 1) {
  const reward = STAR_REWARDS[type];
  const amount = reward.stars * multiplier;
  
  // Показать уведомление
  showStarNotification(amount, reward.message);
  
  // Добавить к балансу
  return amount;
}

function showStarNotification(amount: number, message: string) {
  Alert.alert(
    `+${amount} ⭐`,
    message,
    [{ text: "Круто!  🎉", style: "default" }]
  );
}