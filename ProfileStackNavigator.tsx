import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ProfileScreen from "@/screens/ProfileScreen";
import AdminScreen from "@/screens/AdminScreen";
import ClassChatScreen from "@/screens/ClassChatScreen";
import LeaderboardScreen from "@/screens/LeaderboardScreen";
import PsychologistChatScreen from "@/screens/PsychologistChatScreen";
import OnlineLessonsScreen from "@/screens/OnlineLessonsScreen";
import SettingsScreen from "@/screens/settings/SettingsScreen";
import EditProfileScreen from "@/screens/settings/EditProfileScreen";
import ChangePasswordScreen from "@/screens/settings/ChangePasswordScreen";
import PrivacySettingsScreen from "@/screens/settings/PrivacySettingsScreen";
import NotificationSettingsScreen from "@/screens/settings/NotificationSettingsScreen";
import AppearanceSettingsScreen from "@/screens/settings/AppearanceSettingsScreen";
import BlockedUsersScreen from "@/screens/settings/BlockedUsersScreen";
import AboutScreen from "@/screens/settings/AboutScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type ProfileStackParamList = {
  Profile: undefined;
  Admin: undefined;
  ClassChat: undefined;
  Leaderboard: undefined;
  PsychologistChat: undefined;
  OnlineLessons: undefined;
  Settings: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  PrivacySettings: undefined;
  NotificationSettings: undefined;
  AppearanceSettings: undefined;
  BlockedUsers: undefined;
  About: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerTitle: "Профиль",
        }}
      />
      <Stack.Screen
        name="Admin"
        component={AdminScreen}
        options={{
          headerTitle: "Управление",
        }}
      />
      <Stack.Screen
        name="ClassChat"
        component={ClassChatScreen}
        options={{
          headerTitle: "Чат класса",
        }}
      />
      <Stack.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{
          headerTitle: "Лидеры",
        }}
      />
      <Stack.Screen
        name="PsychologistChat"
        component={PsychologistChatScreen}
        options={{
          headerTitle: "Психолог",
        }}
      />
      <Stack.Screen
        name="OnlineLessons"
        component={OnlineLessonsScreen}
        options={{
          headerTitle: "Онлайн-уроки",
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerTitle: "Настройки",
        }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          headerTitle: "Редактировать профиль",
        }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{
          headerTitle: "Изменить пароль",
        }}
      />
      <Stack.Screen
        name="PrivacySettings"
        component={PrivacySettingsScreen}
        options={{
          headerTitle: "Приватность",
        }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{
          headerTitle: "Уведомления",
        }}
      />
      <Stack.Screen
        name="AppearanceSettings"
        component={AppearanceSettingsScreen}
        options={{
          headerTitle: "Внешний вид",
        }}
      />
      <Stack.Screen
        name="BlockedUsers"
        component={BlockedUsersScreen}
        options={{
          headerTitle: "Чёрный список",
        }}
      />
      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={{
          headerTitle: "О приложении",
        }}
      />
    </Stack.Navigator>
  );
}
