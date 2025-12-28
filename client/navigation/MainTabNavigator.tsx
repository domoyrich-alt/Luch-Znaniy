import React, { useState, useEffect } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View, Text } from "react-native";
import HomeStackNavigator from "@/navigation/HomeStackNavigator";
import ScheduleStackNavigator from "@/navigation/ScheduleStackNavigator";
import CafeteriaStackNavigator from "@/navigation/CafeteriaStackNavigator";
import ProfileStackNavigator from "@/navigation/ProfileStackNavigator";
import ChatsStackNavigator from "@/navigation/ChatsStackNavigator";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Colors, BorderRadius, Spacing } from "@/constants/theme";

// Экраны где нужно скрывать табы
const SCREENS_WITHOUT_TABS = [
  'Chat',
  'ChatNew',
  'TelegramChat',
  'PrivateChat',
  'ChatInfo',
  'ChatProfile',
  'PsychologistChat',
];

// Функция для определения нужно ли показывать табы
const getTabBarVisibility = (route: any) => {
  const routeName = getFocusedRouteNameFromRoute(route);
  if (routeName && SCREENS_WITHOUT_TABS.includes(routeName)) {
    return 'none' as const;
  }
  return 'flex' as const;
};

export type MainTabParamList = {
  HomeTab: undefined;
  ScheduleTab: undefined;
  ChatsTab: undefined; // ✅ ДОБАВЛЯЕМ ЭТО
  CafeteriaTab: undefined;
  ProfileTab:  undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

// Badge component for unread count
const TabBarBadge = ({ count }: { count: number }) => {
  if (count <= 0) return null;
  return (
    <View style={tabBadgeStyles.badge}>
      <Text style={tabBadgeStyles.badgeText}>
        {count > 99 ? '99+' : count}
      </Text>
    </View>
  );
};

const tabBadgeStyles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: -8,
    top: -4,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#0D0D0D',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default function MainTabNavigator() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);

  // Fetch unread count from server
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user?.id) return;
      
      try {
        const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.100.110:5000';
        const response = await fetch(`${API_URL}/api/user/${user.id}/chats`);
        if (response.ok) {
          const chats = await response.json();
          const totalUnread = chats.reduce((sum: number, chat: any) => sum + (chat.unreadCount || 0), 0);
          setUnreadChatsCount(totalUnread);
        }
      } catch (error) {
        // Silently fail
      }
    };

    fetchUnreadCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName:  keyof typeof Feather.glyphMap;

          switch (route.name) {
            case 'HomeTab':
              iconName = 'home';
              break;
            case 'ScheduleTab':
              iconName = 'calendar';
              break;
            case 'ChatsTab':  // ✅ ДОБАВЛЯЕМ ЭТО
              iconName = 'message-circle';
              break;
            case 'CafeteriaTab':
              iconName = 'coffee';
              break;
            case 'ProfileTab':
              iconName = 'user';
              break;
            default: 
              iconName = 'circle';
          }

          return <Feather name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle:  [
          styles.tabBar,
          { 
            backgroundColor: theme.backgroundRoot,
            borderTopColor: theme.border,
          }
        ],
        tabBarBackground: () => (
          <View style={StyleSheet.absoluteFill}>
            <BlurView
              intensity={Platform.OS === 'ios' ? 100 : 50}
              style={StyleSheet. absoluteFill}
            />
          </View>
        ),
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          title: 'Главная',
        }}
      />
      <Tab.Screen
        name="ScheduleTab"
        component={ScheduleStackNavigator}
        options={{
          title: 'Расписание',
        }}
      />
      {/* ✅ ДОБАВЛЯЕМ ЧАТЫ */}
      <Tab.Screen
        name="ChatsTab"
        component={ChatsStackNavigator}
        options={({ route }) => ({
          title: 'Чаты',
          tabBarBadge: unreadChatsCount > 0 ? (unreadChatsCount > 99 ? '99+' : unreadChatsCount) : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#8B5CF6',
            fontSize: 11,
            fontWeight: '700',
            minWidth: 18,
            height: 18,
            lineHeight: 14,
          },
          tabBarStyle: {
            ...styles.tabBar,
            backgroundColor: theme.backgroundRoot,
            borderTopColor: theme.border,
            display: getTabBarVisibility(route),
          },
        })}
      />
      <Tab.Screen
        name="CafeteriaTab"
        component={CafeteriaStackNavigator}
        options={{
          title: 'Кафетерий',
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          title: 'Профиль',
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left:  0,
    right: 0,
    elevation: 0,
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ?  85 : 65,
    paddingBottom: Platform.OS === 'ios' ?  Spacing.lg : Spacing.md,
    paddingTop:  Spacing.sm,
  },
});