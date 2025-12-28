import React, { useState, useRef, useEffect } from "react";
import { 
  View, 
  StyleSheet, 
  Pressable, 
  ScrollView, 
  Modal, 
  TextInput, 
  Alert, 
  Animated, 
  Dimensions, 
  Image, 
  StatusBar,
  Share,
  RefreshControl,
  Switch
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather, MaterialIcons, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { useStars } from "@/context/StarsContext";
import { useSettings } from "@/context/SettingsContext";
import { useFocusEffect } from "@react-navigation/native";

const { width, height } = Dimensions.get('window');

// НЕОНОВЫЕ ЦВЕТА
const NEON = {
  primary: '#8B5CF6',      // Фиолетовый
  secondary: '#4ECDC4',    // Бирюзовый  
  accent: '#FF6B9D',       // Розовый
  warning: '#FFD93D',      // Жёлтый
  success: '#6BCB77',      // Зелёный
  error: '#FF6B6B',        // Красный
  
  bgDark: '#0A0A0F',       // Тёмный фон
  bgCard: '#141420',       // Фон карточки
  bgSecondary: '#1A1A2E',  // Вторичный фон
  
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0B0',
  
  glowPurple: 'rgba(139, 92, 246, 0.5)',
  glowCyan: 'rgba(78, 205, 196, 0.5)',
  glowPink: 'rgba(255, 107, 157, 0.4)',
};

// Подарки
const GIFTS = [
  { id: 1, name: "Плюшевый мишка", emoji: "🧸", price: 10, rarity: "common" },
  { id: 2, name: "Красное сердце", emoji: "❤️", price: 5, rarity: "common" },
  { id: 3, name: "Букет роз", emoji: "🌹", price: 25, rarity: "rare" },
  { id: 4, name: "Торт", emoji: "🎂", price: 30, rarity: "rare" },
  { id: 5, name: "Единорог", emoji: "🦄", price: 150, rarity: "legendary" },
  { id: 6, name: "Фейерверк", emoji: "🎆", price: 75, rarity: "legendary" },
  { id: 7, name: "Бриллиант", emoji: "💎", price: 500, rarity: "epic" },
  { id: 8, name: "Котенок", emoji: "🐱", price: 20, rarity: "rare" }
];

const RARITY_COLORS: Record<string, string> = {
  common: "#22C55E",
  rare: "#3B82F6", 
  legendary: "#F59E0B",
  epic: "#8B5CF6"
};

function getRoleColor(role: string): string {
  switch (role) {
    case "ceo": return "#FF6B6B";
    case "director": return "#4ECDC4";
    case "teacher": return "#45B7D1";
    case "student": return "#96CEB4";
    case "parent": return "#FFEAA7";
    default: return "#DDA0DD";
  }
}

function getRoleLabel(role: string): string {
  switch (role) {
    case "ceo": return "CEO";
    case "director": return "Директор";
    case "teacher": return "Учитель";
    case "student": return "Ученик";
    case "parent": return "Родитель";
    default: return "Пользователь";
  }
}

function getRoleEmoji(role: string): string {
  switch (role) {
    case "ceo": return "👑";
    case "director": return "🎯";
    case "teacher": return "👨‍🏫";
    case "student": return "🎓";
    case "parent": return "👨‍👩‍👧‍👦";
    default: return "👤";
  }
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  const { user, logout } = useAuth();
  const { stars, achievements } = useStars();
  const { settings } = useSettings();
  
  // Состояния
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [giftsModalVisible, setGiftsModalVisible] = useState(false);
  
  // Данные профиля
  const [firstName, setFirstName] = useState(user?.firstName || 'Имя');
  const [lastName, setLastName] = useState(user?.lastName || 'Фамилия');
  const [username, setUsername] = useState('@loading...');
  const [status, setStatus] = useState(settings.profile.status || 'Привет! Я использую это приложение');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(settings.profile.avatar || null);
  const [avgGrade, setAvgGrade] = useState(0);
  
  const userRole = user?.role || 'student';
  const userName = `${firstName} ${lastName}`;
  
  // Загрузка профиля с сервера
  const loadProfile = async () => {
      if (!user?.id) return;
      
      try {
        const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.100.110:5000';
        
        // Загружаем профиль (правильный URL)
        const profileRes = await fetch(`${API_URL}/api/user/${user.id}/profile`);
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData.username) {
            const clean = String(profileData.username).replace(/^@+/, '');
            setUsername(`@${clean}`);
          } else {
            setUsername('Без username');
          }
          if (profileData.status) {
            setStatus(profileData.status);
          }
          // Не затираем локальный аватар из настроек (если пользователь выбрал фото на устройстве)
          if (!settings.profile.avatar && profileData.avatarUrl) {
            setProfilePhoto(profileData.avatarUrl);
          }
        }
        
        // Загружаем средний балл
        const gradesRes = await fetch(`${API_URL}/api/grades/${user.id}`);
        if (gradesRes.ok) {
          const gradesData = await gradesRes.json();
          setAvgGrade(gradesData.averageGrade || 0);
        }
      } catch (error) {
        console.error('Load profile error:', error);
        setUsername('Не загружен');
      }
    };

  // Синхронизация с локальными настройками (аватар/статус) + обновление при фокусе
  useEffect(() => {
    if (settings.profile.avatar) {
      setProfilePhoto(settings.profile.avatar);
    }
    if (typeof settings.profile.status === 'string' && settings.profile.status.length > 0) {
      setStatus(settings.profile.status);
    }
  }, [settings.profile.avatar, settings.profile.status]);

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useFocusEffect(
    React.useCallback(() => {
      loadProfile();
    }, [user?.id, settings.profile.avatar])
  );
  
  // Состояния для друзей и подарков
  const [friendsCount, setFriendsCount] = useState(0);
  const [totalGifts, setTotalGifts] = useState(0);
  
  // Загрузка количества друзей и подарков
  const loadStats = async () => {
    if (!user?.id) return;
    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.100.110:5000';
    
    try {
      // Загружаем количество друзей
      const friendsRes = await fetch(`${API_URL}/api/friends/${user.id}/count`);
      if (friendsRes.ok) {
        const data = await friendsRes.json();
        setFriendsCount(data.count || 0);
      }
      
      // Загружаем количество подарков
      const giftsRes = await fetch(`${API_URL}/api/gifts/${user.id}/count`);
      if (giftsRes.ok) {
        const data = await giftsRes.json();
        setTotalGifts(data.count || 0);
      }
    } catch (error) {
      console.error('Load stats error:', error);
    }
  };
  
  useEffect(() => {
    loadStats();
  }, [user?.id]);
  
  // Статистика
  const level = Math.floor((stars || 0) / 100) + 1;
  const experience = (stars || 0) % 100;
  const nextLevelExp = 100;
  const expProgress = experience / nextLevelExp;
  const averageGrade = avgGrade || 0;
  
  // Анимации
  const profileAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(profileAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true
    }).start();
  }, []);
  
  const onRefresh = async () => {
    setIsRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadProfile();
    await loadStats();
    setIsRefreshing(false);
  };
  
  const pickImage = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8
      });
      
      if (!result.canceled && result.assets[0]) {
        setProfilePhoto(result.assets[0].uri);
      }
    } catch (err) {
      console.error(err);
    }
  };
  
  const shareProfile = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `Профиль ${userName} в SchoolApp\nУровень: ${level}\nЗвёзды: ${stars}`,
      });
    } catch (err) {
      console.error(err);
    }
  };
  
  const saveProfile = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEditModalVisible(false);
    Alert.alert('Успех', 'Профиль обновлён!');
  };
  
  // Компонент статистики
  const StatCard = ({ emoji, value, label, color }: { emoji: string; value: string | number; label: string; color: string }) => (
    <Pressable style={[styles.statCard, { borderColor: color + '40' }]}>
      <LinearGradient
        colors={[color + '20', 'transparent']}
        style={styles.statGradient}
      >
        <ThemedText style={styles.statEmoji}>{emoji}</ThemedText>
        <ThemedText style={[styles.statValue, { color }]}>{value}</ThemedText>
        <ThemedText style={styles.statLabel}>{label}</ThemedText>
      </LinearGradient>
    </Pressable>
  );
  
  // Компонент быстрого действия
  const QuickAction = ({ icon, label, colors, onPress }: { icon: string; label: string; colors: [string, string]; onPress: () => void }) => (
    <Pressable style={styles.quickAction} onPress={onPress}>
      <LinearGradient colors={colors} style={styles.quickActionGradient}>
        <Feather name={icon as any} size={22} color="#FFFFFF" />
      </LinearGradient>
      <ThemedText style={styles.quickActionLabel}>{label}</ThemedText>
    </Pressable>
  );
  
  // Компонент пункта настроек
  const SettingsItem = ({ icon, title, onPress, showArrow = true }: { icon: string; title: string; onPress: () => void; showArrow?: boolean }) => (
    <Pressable style={styles.settingsItem} onPress={onPress}>
      <View style={styles.settingsItemLeft}>
        <View style={styles.settingsIcon}>
          <Feather name={icon as any} size={20} color={NEON.primary} />
        </View>
        <ThemedText style={styles.settingsTitle}>{title}</ThemedText>
      </View>
      {showArrow && <Feather name="chevron-right" size={20} color={NEON.textSecondary} />}
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={22} color={NEON.primary} />
        </Pressable>
        
        <ThemedText style={styles.headerTitle}>Профиль</ThemedText>
        
        <View style={styles.headerRight}>
          <Pressable style={styles.headerButton} onPress={shareProfile}>
            <Feather name="share" size={20} color={NEON.secondary} />
          </Pressable>
          <Pressable style={styles.headerButton} onPress={() => setSettingsModalVisible(true)}>
            <Feather name="settings" size={20} color={NEON.textSecondary} />
          </Pressable>
        </View>
      </View>
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={NEON.primary}
          />
        }
      >
        {/* АВАТАР И ИНФОРМАЦИЯ */}
        <Animated.View style={[styles.profileSection, { opacity: profileAnim }]}>
          {/* Аватар с неоновым кольцом */}
          <Pressable onPress={pickImage} style={styles.avatarWrapper}>
            <View style={styles.avatarGlowRing}>
              <LinearGradient
                colors={[NEON.primary, NEON.accent, NEON.secondary, NEON.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarGradientRing}
              >
                <View style={styles.avatarInner}>
                  {profilePhoto ? (
                    <Image source={{ uri: profilePhoto }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <ThemedText style={styles.avatarInitials}>
                        {firstName.charAt(0)}{lastName.charAt(0)}
                      </ThemedText>
                    </View>
                  )}
                </View>
              </LinearGradient>
            </View>
            
            {/* Бейдж уровня */}
            <View style={styles.levelBadge}>
              <LinearGradient colors={['#FFD700', '#FF8C00']} style={styles.levelBadgeGradient}>
                <ThemedText style={styles.levelText}>LVL {level}</ThemedText>
              </LinearGradient>
            </View>
            
            {/* Онлайн индикатор */}
            <View style={styles.onlineIndicator} />
            
            {/* Кнопка камеры */}
            <View style={styles.cameraButton}>
              <LinearGradient colors={[NEON.primary, NEON.primary + 'CC']} style={styles.cameraGradient}>
                <Feather name="camera" size={14} color="#FFF" />
              </LinearGradient>
            </View>
          </Pressable>
          
          {/* Имя */}
          <ThemedText style={styles.userName}>{userName}</ThemedText>
          
          {/* Роль */}
          <View style={styles.roleWrapper}>
            <LinearGradient
              colors={[getRoleColor(userRole) + '40', getRoleColor(userRole) + '10']}
              style={styles.roleBadge}
            >
              <ThemedText style={styles.roleEmoji}>{getRoleEmoji(userRole)}</ThemedText>
              <ThemedText style={[styles.roleText, { color: getRoleColor(userRole) }]}>
                {getRoleLabel(userRole)}
              </ThemedText>
            </LinearGradient>
          </View>
          
          {/* Статус */}
          <ThemedText style={styles.statusText}>{status}</ThemedText>
          
          {/* Username */}
          <View style={styles.usernameWrapper}>
            <Feather name="at-sign" size={14} color={NEON.primary} />
            <ThemedText style={styles.usernameText}>{username}</ThemedText>
          </View>
        </Animated.View>
        
        {/* СТАТИСТИКА */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            <StatCard emoji="⭐" value={formatNumber(stars || 0)} label="Звёзды" color={NEON.warning} />
            <Pressable onPress={() => (navigation as any).navigate("Gifts")}>
              <StatCard emoji="🎁" value={totalGifts} label="Подарки" color={NEON.accent} />
            </Pressable>
            <Pressable onPress={() => (navigation as any).navigate("Friends")}>
              <StatCard emoji="👥" value={friendsCount} label="Друзья" color={NEON.secondary} />
            </Pressable>
            <StatCard emoji="📊" value={averageGrade.toFixed(1)} label="Ср. балл" color={NEON.success} />
          </View>
        </View>
        
        {/* ПРОГРЕСС УРОВНЯ */}
        <View style={styles.progressSection}>
          <View style={styles.neonCard}>
            <View style={styles.progressHeader}>
              <ThemedText style={styles.progressTitle}>Прогресс уровня</ThemedText>
              <ThemedText style={styles.progressValue}>{experience}/{nextLevelExp} XP</ThemedText>
            </View>
            <View style={styles.progressBarBg}>
              <LinearGradient
                colors={[NEON.primary, NEON.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBarFill, { width: `${expProgress * 100}%` }]}
              />
            </View>
          </View>
        </View>
        
        {/* БЫСТРЫЕ ДЕЙСТВИЯ */}
        <View style={styles.quickActionsSection}>
          <ThemedText style={styles.sectionTitle}>Быстрые действия</ThemedText>
          <View style={styles.quickActionsGrid}>
            <QuickAction 
              icon="edit-3" 
              label="Редактировать" 
              colors={[NEON.primary, NEON.primary + 'CC']} 
              onPress={() => (navigation as any).navigate('EditProfile')} 
            />
            <QuickAction 
              icon="moon" 
              label="Тема" 
              colors={[NEON.accent, NEON.accent + 'CC']} 
              onPress={() => (navigation as any).navigate('AppearanceSettings')} 
            />
            <QuickAction 
              icon="bell" 
              label="Уведомления" 
              colors={[NEON.secondary, NEON.secondary + 'CC']} 
              onPress={() => (navigation as any).navigate('NotificationSettings')} 
            />
            <QuickAction 
              icon="shield" 
              label="Приватность" 
              colors={[NEON.warning, NEON.warning + 'CC']} 
              onPress={() => (navigation as any).navigate('PrivacySettings')} 
            />
          </View>
        </View>
        
        {/* НАСТРОЙКИ */}
        <View style={styles.settingsSection}>
          <ThemedText style={styles.sectionTitle}>Настройки</ThemedText>
          <View style={styles.settingsCard}>
            <SettingsItem icon="user" title="Аккаунт" onPress={() => (navigation as any).navigate('EditProfile')} />
            <SettingsItem icon="lock" title="Безопасность" onPress={() => (navigation as any).navigate('PrivacySettings')} />
            <SettingsItem icon="message-circle" title="Чаты и медиа" onPress={() => Alert.alert('Чаты и медиа', 'Автозагрузка медиа: Вкл\nКачество фото: Высокое\nАвтовоспроизведение видео: Выкл')} />
            <SettingsItem icon="database" title="Память и данные" onPress={() => Alert.alert('Память и данные', 'Использовано: 256 МБ\nКэш: 45 МБ\n\nОчистить кэш?', [{ text: 'Отмена' }, { text: 'Очистить', onPress: () => Alert.alert('Готово', 'Кэш очищен!') }])} />
            <SettingsItem icon="help-circle" title="Помощь" onPress={() => Alert.alert('Помощь', 'FAQ:\n• Как изменить фото профиля?\n• Как включить уведомления?\n• Как связаться с поддержкой?\n\nПоддержка: support@schoolapp.ru')} />
            <SettingsItem icon="info" title="О приложении" onPress={() => Alert.alert('SchoolApp', 'Версия 2.0.0\n© 2024')} />
          </View>
        </View>
        
        {/* КНОПКА ВЫХОДА */}
        <Pressable 
          style={styles.logoutButton}
          onPress={() => Alert.alert('Выход', 'Вы уверены что хотите выйти?', [
            { text: 'Отмена', style: 'cancel' },
            { text: 'Выйти', style: 'destructive', onPress: () => logout() }
          ])}
        >
          <LinearGradient
            colors={[NEON.error + '30', NEON.error + '10']}
            style={styles.logoutGradient}
          >
            <Feather name="log-out" size={20} color={NEON.error} />
            <ThemedText style={styles.logoutText}>Выйти из аккаунта</ThemedText>
          </LinearGradient>
        </Pressable>
        
        <View style={{ height: 100 }} />
      </ScrollView>
      
      {/* МОДАЛКА РЕДАКТИРОВАНИЯ */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalVisible(false)}
      >
        <BlurView intensity={80} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Редактировать профиль</ThemedText>
              <Pressable onPress={() => setEditModalVisible(false)}>
                <Feather name="x" size={24} color={NEON.textPrimary} />
              </Pressable>
            </View>
            
            <View style={styles.formGroup}>
              <ThemedText style={styles.formLabel}>Имя</ThemedText>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholderTextColor={NEON.textSecondary}
              />
            </View>
            
            <View style={styles.formGroup}>
              <ThemedText style={styles.formLabel}>Фамилия</ThemedText>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholderTextColor={NEON.textSecondary}
              />
            </View>
            
            <View style={styles.formGroup}>
              <ThemedText style={styles.formLabel}>Статус</ThemedText>
              <TextInput
                style={[styles.input, { height: 80 }]}
                value={status}
                onChangeText={setStatus}
                multiline
                placeholderTextColor={NEON.textSecondary}
              />
            </View>
            
            <Pressable style={styles.saveButton} onPress={saveProfile}>
              <LinearGradient colors={[NEON.primary, NEON.accent]} style={styles.saveGradient}>
                <Feather name="check" size={20} color="#FFF" />
                <ThemedText style={styles.saveText}>Сохранить</ThemedText>
              </LinearGradient>
            </Pressable>
          </View>
        </BlurView>
      </Modal>
      
      {/* МОДАЛКА НАСТРОЕК */}
      <Modal
        visible={settingsModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <BlurView intensity={80} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Настройки</ThemedText>
              <Pressable onPress={() => setSettingsModalVisible(false)}>
                <Feather name="x" size={24} color={NEON.textPrimary} />
              </Pressable>
            </View>
            
            <View style={styles.settingsOption}>
              <ThemedText style={styles.settingsOptionTitle}>Тёмная тема</ThemedText>
              <Switch
                value={isDark}
                trackColor={{ true: NEON.primary, false: NEON.bgSecondary }}
                thumbColor={NEON.textPrimary}
              />
            </View>
            
            <View style={styles.settingsOption}>
              <ThemedText style={styles.settingsOptionTitle}>Уведомления</ThemedText>
              <Switch
                value={true}
                trackColor={{ true: NEON.primary, false: NEON.bgSecondary }}
                thumbColor={NEON.textPrimary}
              />
            </View>
            
            <View style={styles.settingsOption}>
              <ThemedText style={styles.settingsOptionTitle}>Показывать онлайн</ThemedText>
              <Switch
                value={true}
                trackColor={{ true: NEON.primary, false: NEON.bgSecondary }}
                thumbColor={NEON.textPrimary}
              />
            </View>
          </View>
        </BlurView>
      </Modal>
      
      {/* МОДАЛКА ПОДАРКОВ */}
      <Modal
        visible={giftsModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setGiftsModalVisible(false)}
      >
        <BlurView intensity={80} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>🎁 Мои подарки</ThemedText>
              <Pressable onPress={() => setGiftsModalVisible(false)}>
                <Feather name="x" size={24} color={NEON.textPrimary} />
              </Pressable>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <ThemedText style={styles.giftsSubtitle}>Полученные подарки</ThemedText>
              
              <View style={styles.giftsGrid}>
                {[
                  { emoji: "❤️", name: "Сердце", count: 5, from: "Анна" },
                  { emoji: "🌹", name: "Роза", count: 3, from: "Максим" },
                  { emoji: "🧸", name: "Мишка", count: 2, from: "Ольга" },
                  { emoji: "⭐", name: "Звезда", count: 4, from: "Иван" },
                  { emoji: "🎂", name: "Торт", count: 1, from: "Мария" },
                  { emoji: "💎", name: "Бриллиант", count: 1, from: "Алексей" },
                  { emoji: "🦄", name: "Единорог", count: 2, from: "Катя" },
                  { emoji: "👑", name: "Корона", count: 1, from: "Директор" },
                ].map((gift, idx) => (
                  <View key={idx} style={styles.giftCard}>
                    <LinearGradient
                      colors={[NEON.bgCard, NEON.bgSecondary]}
                      style={styles.giftCardGradient}
                    >
                      <ThemedText style={styles.giftEmoji}>{gift.emoji}</ThemedText>
                      <ThemedText style={styles.giftName}>{gift.name}</ThemedText>
                      <ThemedText style={styles.giftCount}>x{gift.count}</ThemedText>
                      <ThemedText style={styles.giftFrom}>от {gift.from}</ThemedText>
                    </LinearGradient>
                  </View>
                ))}
              </View>
              
              <ThemedText style={[styles.giftsSubtitle, { marginTop: 20 }]}>
                Всего подарков: {totalGifts} 🎁
              </ThemedText>
            </ScrollView>
          </View>
        </BlurView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NEON.bgDark,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: NEON.bgDark,
    borderBottomWidth: 1,
    borderBottomColor: NEON.primary + '20',
    zIndex: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: NEON.bgCard,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: NEON.textPrimary,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  
  // Profile Section
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarGlowRing: {
    width: 130,
    height: 130,
    borderRadius: 65,
    padding: 4,
    shadowColor: NEON.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 15,
  },
  avatarGradientRing: {
    flex: 1,
    borderRadius: 65,
    padding: 4,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 60,
    overflow: 'hidden',
    backgroundColor: NEON.bgCard,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: NEON.bgSecondary,
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: '700',
    color: NEON.primary,
  },
  levelBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
  levelBadgeGradient: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  onlineIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#22C55E',
    borderWidth: 3,
    borderColor: NEON.bgDark,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cameraGradient: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 26,
    fontWeight: '700',
    color: NEON.textPrimary,
    marginBottom: 8,
  },
  roleWrapper: {
    marginBottom: 12,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  roleEmoji: {
    fontSize: 16,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusText: {
    fontSize: 14,
    color: NEON.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  usernameWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: NEON.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  usernameText: {
    fontSize: 14,
    color: NEON.primary,
    fontWeight: '500',
  },
  
  // Stats Section
  statsSection: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (width - 52) / 2,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  statGradient: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    color: NEON.textSecondary,
    marginTop: 4,
  },
  
  // Progress Section
  progressSection: {
    marginBottom: 24,
  },
  neonCard: {
    backgroundColor: NEON.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: NEON.primary + '30',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: NEON.textPrimary,
  },
  progressValue: {
    fontSize: 14,
    color: NEON.primary,
    fontWeight: '500',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: NEON.bgSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  
  // Quick Actions
  quickActionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: NEON.textPrimary,
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    alignItems: 'center',
    width: (width - 60) / 4,
  },
  quickActionGradient: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: NEON.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  quickActionLabel: {
    fontSize: 11,
    color: NEON.textSecondary,
    textAlign: 'center',
  },
  
  // Settings Section
  settingsSection: {
    marginBottom: 24,
  },
  settingsCard: {
    backgroundColor: NEON.bgCard,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: NEON.primary + '20',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: NEON.bgSecondary,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: NEON.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsTitle: {
    fontSize: 16,
    color: NEON.textPrimary,
  },
  
  // Logout Button
  logoutButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: NEON.error + '30',
    borderRadius: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: NEON.error,
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: NEON.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: NEON.textPrimary,
  },
  
  // Form
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: NEON.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: NEON.bgSecondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: NEON.textPrimary,
    borderWidth: 1,
    borderColor: NEON.primary + '30',
  },
  
  // Save Button
  saveButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 10,
  },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  
  // Settings Options
  settingsOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: NEON.bgSecondary,
  },
  settingsOptionTitle: {
    fontSize: 16,
    color: NEON.textPrimary,
  },
  
  // Gifts Modal
  giftsSubtitle: {
    fontSize: 14,
    color: NEON.textSecondary,
    marginBottom: 16,
  },
  giftsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'flex-start',
  },
  giftCard: {
    width: '30%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  giftCardGradient: {
    padding: 12,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: NEON.primary + '30',
  },
  giftEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  giftName: {
    fontSize: 12,
    color: NEON.textPrimary,
    fontWeight: '600',
  },
  giftCount: {
    fontSize: 14,
    color: NEON.warning,
    fontWeight: '700',
    marginTop: 4,
  },
  giftFrom: {
    fontSize: 10,
    color: NEON.textSecondary,
    marginTop: 2,
  },
});
