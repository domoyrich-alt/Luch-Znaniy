import React, { useRef, useEffect, useState } from "react";
import { 
  View, 
  StyleSheet, 
  Pressable, 
  Dimensions,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Extrapolation,
  FadeInDown,
  FadeInUp,
  ZoomIn,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";

import { ThemedText } from "@/components/ThemedText";
import type { HomeStackParamList } from "@/navigation/HomeStackNavigator";
import { useAuth } from "@/context/AuthContext";
import { useStars } from "@/context/StarsContext";
import { apiGet, apiPost } from "@/lib/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const HEADER_MAX_HEIGHT = 280;
const HEADER_MIN_HEIGHT = 100;
const AVATAR_MAX_SIZE = 120;
const AVATAR_MIN_SIZE = 50;

// НЕОНОВЫЕ ЦВЕТА
const NEON = {
  primary: '#8B5CF6',
  secondary: '#4ECDC4',
  accent: '#FF6B9D',
  warning: '#FFD93D',
  success: '#6BCB77',
  error: '#FF6B6B',
  bgDark: '#0A0A0F',
  bgCard: '#141420',
  bgSecondary: '#1A1A2E',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0B0',
  glow: 'rgba(139, 92, 246, 0.5)',
};

type UserProfileRouteProp = RouteProp<HomeStackParamList, 'UserProfile'>;

// Тип для подарка
interface ReceivedGift {
  id: number;
  senderId: number | null;
  receiverId: number;
  giftTypeId: number;
  message: string | null;
  isAnonymous: boolean;
  isOpened: boolean;
  sentAt: string;
  giftType?: {
    id: number;
    name: string;
    emoji: string;
    price: number;
    rarity: string;
    description: string;
  };
  sender?: {
    id: number;
    firstName: string;
    lastName: string;
    username: string;
  };
}

interface GiftType {
  id: number;
  name: string;
  emoji: string;
  price: number;
  rarity: string;
  description: string;
}

// Animated Pressable компонент
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Компонент пульсирующего онлайн индикатора
const PulsingOnlineIndicator = () => {
  const pulse = useSharedValue(1);
  
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      false
    );
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: interpolate(pulse.value, [1, 1.3], [1, 0.5]),
  }));
  
  return (
    <View style={styles.onlineContainer}>
      <Animated.View style={[styles.onlinePulse, animatedStyle]} />
      <View style={styles.onlineDot} />
    </View>
  );
};

// Компонент достижения с анимацией
const AchievementBadge = ({ emoji, index, onPress }: { emoji: string; index: number; onPress: () => void }) => {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const handlePressIn = () => {
    scale.value = withSpring(0.9);
  };
  
  const handlePressOut = () => {
    scale.value = withSpring(1);
  };
  
  return (
    <Animated.View 
      entering={ZoomIn.delay(index * 100).springify()}
      style={animatedStyle}
    >
      <Pressable 
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.achievementBadge}
      >
        <LinearGradient
          colors={[NEON.bgCard, NEON.bgSecondary]}
          style={styles.achievementGradient}
        >
          <ThemedText style={styles.achievementEmoji}>{emoji}</ThemedText>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

// Компонент подарка в профиле (как в Telegram)
const ProfileGiftBadge = ({ gift, index, onPress }: { 
  gift: ReceivedGift; 
  index: number; 
  onPress: () => void 
}) => {
  const scale = useSharedValue(1);
  
  const getRarityColors = (rarity: string): [string, string] => {
    switch (rarity) {
      case 'legendary': return [NEON.warning + '50', NEON.warning + '30'];
      case 'epic': return [NEON.accent + '50', NEON.accent + '30'];
      case 'rare': return [NEON.primary + '50', NEON.primary + '30'];
      default: return [NEON.bgCard, NEON.bgSecondary];
    }
  };
  
  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return NEON.warning + '80';
      case 'epic': return NEON.accent + '60';
      case 'rare': return NEON.primary + '50';
      default: return NEON.primary + '20';
    }
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const handlePressIn = () => {
    scale.value = withSpring(0.9);
  };
  
  const handlePressOut = () => {
    scale.value = withSpring(1);
  };
  
  const rarity = gift.giftType?.rarity || 'common';
  
  return (
    <Animated.View 
      entering={ZoomIn.delay(index * 80).springify()}
      style={animatedStyle}
    >
      <Pressable 
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.profileGiftBadge}
      >
        <LinearGradient
          colors={getRarityColors(rarity)}
          style={[styles.profileGiftGradient, { borderColor: getRarityBorder(rarity) }]}
        >
          <ThemedText style={styles.profileGiftEmoji}>{gift.giftType?.emoji || '🎁'}</ThemedText>
          {!gift.isOpened && (
            <View style={styles.newGiftIndicator}>
              <ThemedText style={styles.newGiftText}>NEW</ThemedText>
            </View>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

// Компонент статистики
const StatItem = ({ value, label, color, icon, delay }: { 
  value: string; 
  label: string; 
  color: string;
  icon?: string;
  delay: number;
}) => {
  return (
    <Animated.View 
      entering={FadeInUp.delay(delay).springify()}
      style={styles.statItem}
    >
      {icon && <ThemedText style={styles.statIcon}>{icon}</ThemedText>}
      <ThemedText style={[styles.statValue, { color }]}>{value}</ThemedText>
      <ThemedText style={styles.statLabel}>{label}</ThemedText>
    </Animated.View>
  );
};

// Компонент информационной строки
const InfoRow = ({ icon, iconColor, label, value, delay }: {
  icon: keyof typeof Feather.glyphMap;
  iconColor: string;
  label: string;
  value: string;
  delay: number;
}) => {
  return (
    <Animated.View 
      entering={FadeInDown.delay(delay).springify()}
      style={styles.infoRow}
    >
      <View style={[styles.infoIconContainer, { backgroundColor: iconColor + '20' }]}>
        <Feather name={icon} size={16} color={iconColor} />
      </View>
      <ThemedText style={styles.infoLabel}>{label}</ThemedText>
      <ThemedText style={styles.infoValue}>{value}</ThemedText>
    </Animated.View>
  );
};

// Активность за неделю
const WeeklyActivity = () => {
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const activity = [0.3, 0.7, 0.5, 0.9, 0.4, 0.8, 0.6]; // 0-1 уровень активности
  
  return (
    <Animated.View entering={FadeInDown.delay(600).springify()} style={styles.activityContainer}>
      <View style={styles.activityHeader}>
        <ThemedText style={styles.sectionTitle}>Активность</ThemedText>
        <ThemedText style={styles.activityPeriod}>Эта неделя</ThemedText>
      </View>
      <View style={styles.activityBars}>
        {days.map((day, index) => (
          <View key={day} style={styles.activityBarContainer}>
            <View style={styles.activityBarBg}>
              <Animated.View 
                entering={FadeInDown.delay(700 + index * 50).springify()}
                style={[
                  styles.activityBar,
                  { 
                    height: `${activity[index] * 100}%`,
                    backgroundColor: activity[index] > 0.7 ? NEON.success : 
                                     activity[index] > 0.4 ? NEON.secondary : NEON.textSecondary,
                  }
                ]} 
              />
            </View>
            <ThemedText style={styles.activityDay}>{day}</ThemedText>
          </View>
        ))}
      </View>
    </Animated.View>
  );
};

export default function UserProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<UserProfileRouteProp>();
  const { user: currentUser } = useAuth();
  const { stars, spendStars } = useStars();
  
  const { userId, firstName, lastName, username, avgGrade } = route.params;
  const normalizedUsername = typeof username === 'string' ? username.replace(/^@+/, '') : '';
  
  // State для подарков
  const [receivedGifts, setReceivedGifts] = useState<ReceivedGift[]>([]);
  const [giftTypes, setGiftTypes] = useState<GiftType[]>([]);
  const [loadingGifts, setLoadingGifts] = useState(true);
  const [showSendGiftModal, setShowSendGiftModal] = useState(false);
  const [selectedGift, setSelectedGift] = useState<GiftType | null>(null);
  const [giftMessage, setGiftMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [sendingGift, setSendingGift] = useState(false);
  const [showGiftDetailModal, setShowGiftDetailModal] = useState(false);
  const [selectedReceivedGift, setSelectedReceivedGift] = useState<ReceivedGift | null>(null);
  
  // Загрузка подарков пользователя
  useEffect(() => {
    loadGifts();
    loadGiftTypes();
  }, [userId]);
  
  const loadGifts = async () => {
    try {
      setLoadingGifts(true);
      const gifts = await apiGet<ReceivedGift[]>(`/api/gifts/received/${userId}`);
      setReceivedGifts(gifts || []);
    } catch (error) {
      console.error('Error loading gifts:', error);
    } finally {
      setLoadingGifts(false);
    }
  };
  
  const loadGiftTypes = async () => {
    try {
      const types = await apiGet<GiftType[]>('/api/gifts/types');
      setGiftTypes(types || []);
    } catch (error) {
      console.error('Error loading gift types:', error);
    }
  };
  
  const handleSendGiftConfirm = async () => {
    if (!selectedGift || !currentUser) return;
    
    if (stars < selectedGift.price) {
      Alert.alert('Недостаточно звёзд', `Вам нужно ${selectedGift.price} ⭐, а у вас ${stars} ⭐`);
      return;
    }
    
    setSendingGift(true);
    try {
      const result = await apiPost('/api/gifts/send', {
        senderId: currentUser.id,
        receiverId: userId,
        giftTypeId: selectedGift.id,
        message: giftMessage || null,
        isAnonymous,
      });
      
      spendStars(selectedGift.price);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('🎁 Подарок отправлен!', `${selectedGift.emoji} ${selectedGift.name} отправлен ${firstName}!`);
      
      setShowSendGiftModal(false);
      setSelectedGift(null);
      setGiftMessage('');
      setIsAnonymous(false);
      
      // Обновляем список подарков
      loadGifts();
    } catch (error) {
      console.error('Error sending gift:', error);
      Alert.alert('Ошибка', 'Не удалось отправить подарок');
    } finally {
      setSendingGift(false);
    }
  };
  
  const handleGiftPress = (gift: ReceivedGift) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedReceivedGift(gift);
    setShowGiftDetailModal(true);
  };
  
  // Анимация скролла
  const scrollY = useSharedValue(0);
  const buttonScale = useSharedValue(1);
  
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });
  
  // Анимированные стили для header
  const headerAnimatedStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [0, HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT],
      [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
      Extrapolation.CLAMP
    );
    return { height };
  });
  
  // Анимированные стили для аватара
  const avatarAnimatedStyle = useAnimatedStyle(() => {
    const size = interpolate(
      scrollY.value,
      [0, HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT],
      [AVATAR_MAX_SIZE, AVATAR_MIN_SIZE],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      scrollY.value,
      [0, HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT],
      [0, 20],
      Extrapolation.CLAMP
    );
    return {
      width: size,
      height: size,
      borderRadius: size / 2,
      transform: [{ translateY }],
    };
  });
  
  // Анимированные стили для имени
  const nameAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 100],
      [1, 0],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      scrollY.value,
      [0, 100],
      [0, -20],
      Extrapolation.CLAMP
    );
    return { opacity, transform: [{ translateY }] };
  });
  
  // Анимированные стили для header title
  const headerTitleAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [50, 120],
      [0, 1],
      Extrapolation.CLAMP
    );
    return { opacity };
  });
  
  // Glow эффект для аватара
  const glowAnimatedStyle = useAnimatedStyle(() => {
    const glowSize = interpolate(
      scrollY.value,
      [0, HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT],
      [140, 70],
      Extrapolation.CLAMP
    );
    return {
      width: glowSize,
      height: glowSize,
      borderRadius: glowSize / 2,
    };
  });
  
  const getGradeColor = (grade: number | undefined) => {
    if (!grade) return NEON.textSecondary;
    if (grade >= 4.5) return NEON.success;
    if (grade >= 4.0) return NEON.secondary;
    if (grade >= 3.5) return NEON.warning;
    return NEON.error;
  };

  const handleOpenChat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    (navigation as any).navigate("ChatsTab", {
      screen: "TelegramChat",
      params: {
        chatId: `private_${userId}`,
        otherUserId: userId,
        otherUserName: `${firstName} ${lastName}`,
        chatType: 'private',
      },
    });
  };

  const handleSendGift = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowSendGiftModal(true);
  };
  
  const handleAchievementPress = (emoji: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("🏆 Достижение", `Это достижение ${emoji} было получено за отличную учёбу!`);
  };

  const handleButtonPressIn = () => {
    buttonScale.value = withSpring(0.95);
  };
  
  const handleButtonPressOut = () => {
    buttonScale.value = withSpring(1);
  };
  
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const achievements = [
    { emoji: "🏅", name: "Отличник" },
    { emoji: "🎯", name: "Целеустремлённый" },
    { emoji: "📚", name: "Книголюб" },
    { emoji: "⭐", name: "Звезда класса" },
    { emoji: "🏆", name: "Победитель" },
    { emoji: "🔥", name: "В ударе" },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Animated Header */}
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <LinearGradient
          colors={[NEON.primary + '30', NEON.accent + '20', 'transparent']}
          style={StyleSheet.absoluteFill}
        />
        
        {/* Back Button */}
        <View style={styles.headerButtons}>
          <Pressable 
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.goBack(); }} 
            style={styles.backButton}
          >
            <BlurView intensity={80} tint="dark" style={styles.blurButton}>
              <Feather name="arrow-left" size={22} color={NEON.textPrimary} />
            </BlurView>
          </Pressable>
          
          <Animated.View style={headerTitleAnimatedStyle}>
            <ThemedText style={styles.headerTitle}>{firstName} {lastName}</ThemedText>
          </Animated.View>
          
          <Pressable 
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            style={styles.moreButton}
          >
            <BlurView intensity={80} tint="dark" style={styles.blurButton}>
              <Feather name="more-vertical" size={22} color={NEON.textPrimary} />
            </BlurView>
          </Pressable>
        </View>
        
        {/* Avatar with Glow */}
        <Animated.View style={[styles.avatarContainer, nameAnimatedStyle]}>
          <Animated.View style={[styles.avatarGlow, glowAnimatedStyle]} />
          <Animated.View style={[styles.avatarWrapper, avatarAnimatedStyle]}>
            <LinearGradient
              colors={[NEON.primary, NEON.accent, NEON.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarGradient}
            >
              <View style={styles.avatarInner}>
                <ThemedText style={styles.avatarText}>
                  {firstName.charAt(0)}{lastName.charAt(0)}
                </ThemedText>
              </View>
            </LinearGradient>
          </Animated.View>
          <PulsingOnlineIndicator />
        </Animated.View>
        
        {/* Name & Username */}
        <Animated.View style={[styles.nameContainer, nameAnimatedStyle]}>
          <ThemedText style={styles.userName}>{firstName} {lastName}</ThemedText>
          <ThemedText style={styles.userUsername}>@{normalizedUsername || 'username'}</ThemedText>
        </Animated.View>
      </Animated.View>

      {/* Scrollable Content */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.scrollContent, { paddingTop: HEADER_MAX_HEIGHT - 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Role Badge */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.roleBadgeContainer}>
          <LinearGradient
            colors={[NEON.primary + '30', NEON.accent + '20']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.roleBadge}
          >
            <ThemedText style={styles.roleEmoji}>👨‍🎓</ThemedText>
            <ThemedText style={styles.roleText}>Ученик</ThemedText>
          </LinearGradient>
        </Animated.View>

        {/* Stats Section */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.statsContainer}>
          <LinearGradient colors={[NEON.bgCard, NEON.bgSecondary]} style={styles.statsGradient}>
            <View style={styles.statsRow}>
              <StatItem 
                value={avgGrade?.toFixed(1) || "---"} 
                label="Средний балл" 
                color={getGradeColor(avgGrade)}
                delay={250}
              />
              <View style={styles.statDivider} />
              <StatItem 
                value="9А" 
                label="Класс" 
                color={NEON.secondary}
                delay={300}
              />
              <View style={styles.statDivider} />
              <StatItem 
                value="156" 
                label="Звёзды" 
                color={NEON.warning}
                icon="⭐"
                delay={350}
              />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.actionsContainer}>
          <AnimatedPressable 
            onPress={handleOpenChat} 
            onPressIn={handleButtonPressIn}
            onPressOut={handleButtonPressOut}
            style={[styles.primaryButton, buttonAnimatedStyle]}
          >
            <LinearGradient
              colors={[NEON.primary, NEON.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Feather name="message-circle" size={20} color="#FFF" />
              <ThemedText style={styles.buttonText}>Написать</ThemedText>
            </LinearGradient>
          </AnimatedPressable>

          <Pressable onPress={handleSendGift} style={styles.secondaryButton}>
            <MaterialCommunityIcons name="gift-outline" size={22} color={NEON.accent} />
          </Pressable>
          
          <Pressable style={styles.secondaryButton}>
            <Feather name="phone" size={20} color={NEON.secondary} />
          </Pressable>
        </Animated.View>

        {/* Weekly Activity */}
        <WeeklyActivity />

        {/* Gifts Section - Like Telegram */}
        <Animated.View entering={FadeInDown.delay(350).springify()} style={styles.giftsSection}>
          <View style={styles.giftsHeader}>
            <ThemedText style={styles.sectionTitle}>🎁 Подарки</ThemedText>
            {receivedGifts.length > 0 && (
              <View style={styles.giftCountBadge}>
                <ThemedText style={styles.giftCountText}>{receivedGifts.length}</ThemedText>
              </View>
            )}
          </View>
          
          {loadingGifts ? (
            <View style={styles.giftsLoadingContainer}>
              <ActivityIndicator color={NEON.primary} />
            </View>
          ) : receivedGifts.length > 0 ? (
            <View style={styles.giftsGrid}>
              {receivedGifts.slice(0, 8).map((gift, index) => (
                <ProfileGiftBadge 
                  key={gift.id} 
                  gift={gift} 
                  index={index}
                  onPress={() => handleGiftPress(gift)}
                />
              ))}
              {receivedGifts.length > 8 && (
                <Pressable 
                  style={styles.moreGiftsButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    Alert.alert('Все подарки', `У ${firstName} ${receivedGifts.length} подарков`);
                  }}
                >
                  <LinearGradient
                    colors={[NEON.bgCard, NEON.bgSecondary]}
                    style={styles.moreGiftsGradient}
                  >
                    <ThemedText style={styles.moreGiftsText}>+{receivedGifts.length - 8}</ThemedText>
                  </LinearGradient>
                </Pressable>
              )}
            </View>
          ) : (
            <View style={styles.noGiftsContainer}>
              <ThemedText style={styles.noGiftsEmoji}>🎁</ThemedText>
              <ThemedText style={styles.noGiftsText}>Ещё нет подарков</ThemedText>
              <ThemedText style={styles.noGiftsSubtext}>Будьте первым, кто подарит!</ThemedText>
            </View>
          )}
        </Animated.View>

        {/* Info Section */}
        <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.infoSection}>
          <ThemedText style={styles.sectionTitle}>Информация</ThemedText>
          
          <View style={styles.infoCard}>
            <LinearGradient colors={[NEON.bgCard, NEON.bgSecondary]} style={styles.infoGradient}>
              <InfoRow icon="book" iconColor={NEON.primary} label="Любимый предмет" value="Математика" delay={450} />
              <View style={styles.infoDivider} />
              <InfoRow icon="award" iconColor={NEON.success} label="Достижения" value="12 🏆" delay={500} />
              <View style={styles.infoDivider} />
              <InfoRow icon="calendar" iconColor={NEON.secondary} label="В школе с" value="Сентябрь 2023" delay={550} />
              <View style={styles.infoDivider} />
              <InfoRow icon="clock" iconColor={NEON.accent} label="Последний визит" value="Сейчас онлайн" delay={600} />
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Achievements Preview */}
        <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.achievementsSection}>
          <View style={styles.achievementsHeader}>
            <ThemedText style={styles.sectionTitle}>Достижения</ThemedText>
            <Pressable>
              <ThemedText style={styles.viewAllText}>Все →</ThemedText>
            </Pressable>
          </View>
          
          <View style={styles.achievementsList}>
            {achievements.map((achievement, index) => (
              <AchievementBadge 
                key={index} 
                emoji={achievement.emoji} 
                index={index}
                onPress={() => handleAchievementPress(achievement.emoji)}
              />
            ))}
          </View>
        </Animated.View>
        
        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {/* Send Gift Modal */}
      <Modal
        visible={showSendGiftModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSendGiftModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={[NEON.bgCard, NEON.bgDark]}
              style={styles.modalGradient}
            >
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>🎁 Отправить подарок</ThemedText>
                <ThemedText style={styles.modalSubtitle}>для {firstName} {lastName}</ThemedText>
                <Pressable 
                  style={styles.modalCloseButton}
                  onPress={() => setShowSendGiftModal(false)}
                >
                  <Feather name="x" size={24} color={NEON.textSecondary} />
                </Pressable>
              </View>
              
              {/* Stars Balance */}
              <View style={styles.starsBalanceContainer}>
                <ThemedText style={styles.starsBalanceLabel}>Ваш баланс:</ThemedText>
                <ThemedText style={styles.starsBalance}>⭐ {stars}</ThemedText>
              </View>
              
              {/* Gift Selection */}
              <ScrollView style={styles.giftsScrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.giftTypesList}>
                  {giftTypes.map((giftType) => {
                    const isSelected = selectedGift?.id === giftType.id;
                    const canAfford = stars >= giftType.price;
                    
                    return (
                      <Pressable
                        key={giftType.id}
                        style={[
                          styles.giftTypeItem,
                          isSelected && styles.giftTypeItemSelected,
                          !canAfford && styles.giftTypeItemDisabled,
                        ]}
                        onPress={() => {
                          if (canAfford) {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setSelectedGift(giftType);
                          } else {
                            Alert.alert('Недостаточно звёзд', `Нужно ${giftType.price} ⭐`);
                          }
                        }}
                      >
                        <View style={styles.giftTypeEmoji}>
                          <ThemedText style={styles.giftTypeEmojiText}>{giftType.emoji}</ThemedText>
                        </View>
                        <View style={styles.giftTypeInfo}>
                          <ThemedText style={styles.giftTypeName}>{giftType.name}</ThemedText>
                          <ThemedText style={styles.giftTypeRarity}>{giftType.rarity}</ThemedText>
                        </View>
                        <ThemedText style={[
                          styles.giftTypePrice,
                          !canAfford && styles.giftTypePriceDisabled
                        ]}>
                          ⭐ {giftType.price}
                        </ThemedText>
                        {isSelected && (
                          <View style={styles.giftTypeCheckmark}>
                            <Feather name="check" size={16} color={NEON.success} />
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
              
              {/* Options */}
              {selectedGift && (
                <View style={styles.giftOptions}>
                  <Pressable
                    style={styles.anonymousOption}
                    onPress={() => setIsAnonymous(!isAnonymous)}
                  >
                    <View style={[styles.checkbox, isAnonymous && styles.checkboxChecked]}>
                      {isAnonymous && <Feather name="check" size={14} color="#FFF" />}
                    </View>
                    <ThemedText style={styles.anonymousText}>Отправить анонимно</ThemedText>
                  </Pressable>
                </View>
              )}
              
              {/* Send Button */}
              <Pressable
                style={[
                  styles.sendGiftButton,
                  (!selectedGift || sendingGift) && styles.sendGiftButtonDisabled
                ]}
                onPress={handleSendGiftConfirm}
                disabled={!selectedGift || sendingGift}
              >
                <LinearGradient
                  colors={selectedGift ? [NEON.primary, NEON.accent] : [NEON.bgSecondary, NEON.bgSecondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.sendGiftButtonGradient}
                >
                  {sendingGift ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <ThemedText style={styles.sendGiftButtonText}>
                      {selectedGift ? `Отправить за ${selectedGift.price} ⭐` : 'Выберите подарок'}
                    </ThemedText>
                  )}
                </LinearGradient>
              </Pressable>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* Gift Detail Modal */}
      <Modal
        visible={showGiftDetailModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowGiftDetailModal(false)}
      >
        <Pressable 
          style={styles.giftDetailOverlay}
          onPress={() => setShowGiftDetailModal(false)}
        >
          <View style={styles.giftDetailContent}>
            <LinearGradient
              colors={[NEON.bgCard, NEON.bgDark]}
              style={styles.giftDetailGradient}
            >
              {selectedReceivedGift && (
                <>
                  <ThemedText style={styles.giftDetailEmoji}>
                    {selectedReceivedGift.giftType?.emoji || '🎁'}
                  </ThemedText>
                  <ThemedText style={styles.giftDetailName}>
                    {selectedReceivedGift.giftType?.name || 'Подарок'}
                  </ThemedText>
                  <ThemedText style={styles.giftDetailFrom}>
                    {selectedReceivedGift.isAnonymous 
                      ? 'От анонимного отправителя' 
                      : `От ${selectedReceivedGift.sender?.firstName || 'кого-то'} ${selectedReceivedGift.sender?.lastName || ''}`
                    }
                  </ThemedText>
                  {selectedReceivedGift.message && (
                    <View style={styles.giftDetailMessageContainer}>
                      <ThemedText style={styles.giftDetailMessage}>
                        "{selectedReceivedGift.message}"
                      </ThemedText>
                    </View>
                  )}
                  <ThemedText style={styles.giftDetailDate}>
                    {new Date(selectedReceivedGift.sentAt).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </ThemedText>
                </>
              )}
            </LinearGradient>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NEON.bgDark },
  
  // Header
  header: { 
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    alignItems: 'center',
    overflow: 'hidden',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  backButton: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
  moreButton: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
  blurButton: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: 'rgba(20, 20, 32, 0.6)',
  },
  headerTitle: { 
    fontSize: 17, 
    fontWeight: '600', 
    color: NEON.textPrimary,
  },
  
  // Avatar
  avatarContainer: { 
    alignItems: 'center', 
    marginTop: 8,
  },
  avatarWrapper: {
    overflow: 'hidden',
  },
  avatarGlow: {
    position: 'absolute',
    backgroundColor: NEON.glow,
    opacity: 0.5,
  },
  avatarGradient: { 
    flex: 1,
    padding: 3,
    borderRadius: 999,
  },
  avatarInner: { 
    flex: 1, 
    borderRadius: 999, 
    backgroundColor: NEON.bgDark, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  avatarText: { fontSize: 36, fontWeight: '700', color: NEON.textPrimary },
  
  // Online Indicator
  onlineContainer: {
    position: 'absolute',
    bottom: 5,
    right: -5,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlinePulse: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: NEON.success,
  },
  onlineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: NEON.success,
    borderWidth: 2,
    borderColor: NEON.bgDark,
  },
  
  // Name
  nameContainer: { alignItems: 'center', marginTop: 12 },
  userName: { fontSize: 24, fontWeight: '700', color: NEON.textPrimary },
  userUsername: { fontSize: 15, color: NEON.textSecondary, marginTop: 4 },
  
  // Scroll Content
  scrollContent: { paddingHorizontal: 16 },
  
  // Role Badge
  roleBadgeContainer: { alignItems: 'center', marginBottom: 20 },
  roleBadge: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20,
    gap: 6,
  },
  roleEmoji: { fontSize: 16 },
  roleText: { fontSize: 14, color: NEON.textPrimary, fontWeight: '600' },
  
  // Stats Section
  statsContainer: { marginBottom: 20 },
  statsGradient: { 
    borderRadius: 20, 
    padding: 20, 
    borderWidth: 1, 
    borderColor: NEON.primary + '30' 
  },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', flex: 1 },
  statIcon: { fontSize: 14, marginBottom: 2 },
  statValue: { fontSize: 26, fontWeight: '700' },
  statLabel: { fontSize: 12, color: NEON.textSecondary, marginTop: 4 },
  statDivider: { width: 1, height: 50, backgroundColor: NEON.bgSecondary },
  
  // Action Buttons
  actionsContainer: { 
    flexDirection: 'row', 
    gap: 12, 
    marginBottom: 24 
  },
  primaryButton: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  buttonGradient: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 16,
    gap: 8,
  },
  buttonText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  secondaryButton: { 
    width: 56,
    height: 56,
    alignItems: 'center', 
    justifyContent: 'center', 
    borderRadius: 16, 
    backgroundColor: NEON.bgCard,
    borderWidth: 1,
    borderColor: NEON.bgSecondary,
  },
  
  // Activity
  activityContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: NEON.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: NEON.primary + '20',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityPeriod: {
    fontSize: 13,
    color: NEON.textSecondary,
  },
  activityBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 80,
  },
  activityBarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  activityBarBg: {
    width: 24,
    height: 60,
    backgroundColor: NEON.bgSecondary,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  activityBar: {
    width: '100%',
    borderRadius: 12,
  },
  activityDay: {
    fontSize: 11,
    color: NEON.textSecondary,
    marginTop: 6,
  },
  
  // Info Section
  infoSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: NEON.textPrimary, marginBottom: 12 },
  infoCard: { borderRadius: 20, overflow: 'hidden' },
  infoGradient: { 
    padding: 16, 
    borderWidth: 1, 
    borderColor: NEON.primary + '20', 
    borderRadius: 20 
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoLabel: { flex: 1, fontSize: 14, color: NEON.textSecondary },
  infoValue: { fontSize: 14, fontWeight: '600', color: NEON.textPrimary },
  infoDivider: { height: 1, backgroundColor: NEON.bgSecondary, marginVertical: 4 },
  
  // Achievements
  achievementsSection: { marginBottom: 24 },
  achievementsHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllText: { fontSize: 14, color: NEON.primary, fontWeight: '600' },
  achievementsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  achievementBadge: { borderRadius: 16, overflow: 'hidden' },
  achievementGradient: { 
    width: (SCREEN_WIDTH - 32 - 60) / 6, 
    height: (SCREEN_WIDTH - 32 - 60) / 6,
    minWidth: 52,
    minHeight: 52,
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: NEON.primary + '30',
    borderRadius: 16,
  },
  achievementEmoji: { fontSize: 24 },
  
  // Profile Gifts Section
  giftsSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: NEON.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: NEON.accent + '30',
  },
  giftsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  giftCountBadge: {
    backgroundColor: NEON.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  giftCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  giftsLoadingContainer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  giftsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  profileGiftBadge: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  profileGiftGradient: {
    width: (SCREEN_WIDTH - 32 - 32 - 30) / 4,
    height: (SCREEN_WIDTH - 32 - 32 - 30) / 4,
    minWidth: 60,
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 16,
  },
  profileGiftEmoji: {
    fontSize: 28,
  },
  newGiftIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: NEON.accent,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  newGiftText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFF',
  },
  moreGiftsButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  moreGiftsGradient: {
    width: (SCREEN_WIDTH - 32 - 32 - 30) / 4,
    height: (SCREEN_WIDTH - 32 - 32 - 30) / 4,
    minWidth: 60,
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: NEON.textSecondary + '30',
    borderRadius: 16,
  },
  moreGiftsText: {
    fontSize: 16,
    fontWeight: '700',
    color: NEON.textSecondary,
  },
  noGiftsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noGiftsEmoji: {
    fontSize: 40,
    opacity: 0.5,
    marginBottom: 8,
  },
  noGiftsText: {
    fontSize: 15,
    color: NEON.textSecondary,
    marginBottom: 4,
  },
  noGiftsSubtext: {
    fontSize: 13,
    color: NEON.textSecondary,
    opacity: 0.7,
  },
  
  // Send Gift Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    maxHeight: '85%',
  },
  modalGradient: {
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: NEON.textPrimary,
  },
  modalSubtitle: {
    fontSize: 14,
    color: NEON.textSecondary,
    marginTop: 4,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 4,
  },
  starsBalanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    padding: 12,
    backgroundColor: NEON.bgSecondary,
    borderRadius: 12,
    gap: 8,
  },
  starsBalanceLabel: {
    fontSize: 14,
    color: NEON.textSecondary,
  },
  starsBalance: {
    fontSize: 18,
    fontWeight: '700',
    color: NEON.warning,
  },
  giftsScrollView: {
    maxHeight: 300,
    marginBottom: 16,
  },
  giftTypesList: {
    gap: 10,
  },
  giftTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: NEON.bgSecondary,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  giftTypeItemSelected: {
    borderColor: NEON.primary,
    backgroundColor: NEON.primary + '20',
  },
  giftTypeItemDisabled: {
    opacity: 0.5,
  },
  giftTypeEmoji: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: NEON.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftTypeEmojiText: {
    fontSize: 24,
  },
  giftTypeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  giftTypeName: {
    fontSize: 15,
    fontWeight: '600',
    color: NEON.textPrimary,
  },
  giftTypeRarity: {
    fontSize: 12,
    color: NEON.textSecondary,
    textTransform: 'capitalize',
  },
  giftTypePrice: {
    fontSize: 15,
    fontWeight: '700',
    color: NEON.warning,
  },
  giftTypePriceDisabled: {
    color: NEON.textSecondary,
  },
  giftTypeCheckmark: {
    marginLeft: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: NEON.success + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftOptions: {
    marginBottom: 16,
  },
  anonymousOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: NEON.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: NEON.primary,
    borderColor: NEON.primary,
  },
  anonymousText: {
    fontSize: 14,
    color: NEON.textSecondary,
  },
  sendGiftButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  sendGiftButtonDisabled: {
    opacity: 0.7,
  },
  sendGiftButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendGiftButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  
  // Gift Detail Modal
  giftDetailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  giftDetailContent: {
    borderRadius: 24,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 300,
  },
  giftDetailGradient: {
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: NEON.primary + '30',
    borderRadius: 24,
  },
  giftDetailEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  giftDetailName: {
    fontSize: 22,
    fontWeight: '700',
    color: NEON.textPrimary,
    marginBottom: 8,
  },
  giftDetailFrom: {
    fontSize: 14,
    color: NEON.textSecondary,
    marginBottom: 12,
  },
  giftDetailMessageContainer: {
    backgroundColor: NEON.bgSecondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  giftDetailMessage: {
    fontSize: 14,
    color: NEON.textPrimary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  giftDetailDate: {
    fontSize: 12,
    color: NEON.textSecondary,
  },
});
