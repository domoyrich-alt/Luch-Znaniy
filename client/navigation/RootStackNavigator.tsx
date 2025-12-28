import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "@/context/AuthContext";

import InviteCodeScreen from "@/screens/InviteCodeScreen";
import RegisterProfileScreen from "@/screens/RegisterProfileScreen";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import PsychologistChatScreen from "@/screens/PsychologistChatScreen";
import LeaderboardScreen from "@/screens/LeaderboardScreen";
import OnlineLessonsScreen from "@/screens/OnlineLessonsScreen";
import ClubsScreen from "@/screens/ClubsScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import AnalyticsScreen from "@/screens/AnalyticsScreen";
import ForumScreen from "@/screens/ForumScreen";
import AdminScreen from "@/screens/AdminScreen";
import AnnouncementsModal from "@/screens/AnnouncementsModal";
import HomeworkModal from "@/screens/HomeworkModal";
import EventsModal from "@/screens/EventsModal";
import CheckInScreen from "@/screens/CheckInScreen";
import FriendsScreen from "@/screens/FriendsScreen";
import GiftsScreen from "@/screens/GiftsScreen";
import AchievementsScreen from "@/screens/AchievementsScreen";
import ParentPortalScreen from "@/screens/ParentPortalScreen";
import HomeworkScreen from "@/screens/HomeworkScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type RootStackParamList = {
  InviteCode: undefined;
  RegisterProfile: { userId: number; firstName: string; lastName: string };
  Main: undefined;
  ClassChat: undefined;
  PsychologistChat: undefined;
  Leaderboard: undefined;
  OnlineLessons: undefined;
  Clubs: undefined;
  Settings: undefined;
  Analytics: undefined;
  Forum: undefined;
  Admin: undefined;
  AnnouncementsModal: undefined;
  HomeworkModal: undefined;
  EventsModal: undefined;
  CheckIn: undefined;
  Friends: undefined;
  Gifts: undefined;
  Achievements: undefined;
  ParentPortal: undefined;
  Homework: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const { user, needsProfileSetup, pendingUserId, pendingUserData } = useAuth();
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {!user && !needsProfileSetup ? (
        <Stack.Screen
          name="InviteCode"
          component={InviteCodeScreen}
          options={{ headerShown: false }}
        />
      ) : needsProfileSetup && pendingUserId ? (
        <Stack.Screen
          name="RegisterProfile"
          component={RegisterProfileScreen}
          options={{ headerShown: false }}
          initialParams={{
            userId: pendingUserId,
            firstName: pendingUserData?.firstName || "",
            lastName: pendingUserData?.lastName || "",
          }}
        />
      ) : (
        <>
          <Stack.Screen
            name="Main"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
          
          {/* МОДАЛЬНЫЕ ЭКРАНЫ */}
          <Stack.Screen
            name="AnnouncementsModal"
            component={AnnouncementsModal}
            options={{
              headerTitle: "Новости",
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="HomeworkModal"
            component={HomeworkModal}
            options={{
              headerTitle: "Домашние задания",
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="EventsModal"
            component={EventsModal}
            options={{
              headerTitle: "Мероприятия",
              presentation: "modal",
            }}
          />

          <Stack.Screen
            name="CheckIn"
            component={CheckInScreen}
            options={{ headerTitle: "Посещаемость" }}
          />
          
         
          
          {/* ОСТАЛЬНЫЕ ЭКРАНЫ */}
          <Stack.Screen
            name="Leaderboard"
            component={LeaderboardScreen}
            options={{ headerTitle: "Рейтинг" }}
          />
          <Stack.Screen
            name="OnlineLessons"
            component={OnlineLessonsScreen}
            options={{ headerTitle: "Онлайн уроки" }}
          />
          <Stack.Screen
            name="Clubs"
            component={ClubsScreen}
            options={{ headerTitle: "Кружки" }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ headerTitle: "Настройки" }}
          />
          <Stack.Screen
            name="Analytics"
            component={AnalyticsScreen}
            options={{ headerTitle: "Аналитика" }}
          />
          <Stack.Screen
            name="Forum"
            component={ForumScreen}
            options={{ headerTitle: "Форум" }}
          />
          <Stack.Screen
            name="Admin"
            component={AdminScreen}
            options={{ headerTitle: "Управление" }}
          />
          <Stack.Screen
            name="Friends"
            component={FriendsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Gifts"
            component={GiftsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Achievements"
            component={AchievementsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ParentPortal"
            component={ParentPortalScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Homework"
            component={HomeworkScreen}
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}