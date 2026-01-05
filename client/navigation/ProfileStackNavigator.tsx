import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import ProfileScreen from "@/screens/ProfileScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import EditProfileScreen from "@/screens/EditProfileScreen";
import PrivacySettingsScreen from "@/screens/PrivacySettingsScreen";
import NotificationSettingsScreen from "@/screens/NotificationSettingsScreen";
import AppearanceSettingsScreen from "@/screens/AppearanceSettingsScreen";
import BlockedUsersScreen from "@/screens/BlockedUsersScreen";
import TeacherJournalScreen from "@/screens/TeacherJournalScreen";
import GradesScreen from "@/screens/GradesScreen";
import ClassListScreen from "@/screens/ClassListScreen";
import MyGiftsScreen from "@/screens/MyGiftsScreen";
import UserProfileScreen from "@/screens/UserProfileScreen";
import { useTheme } from "@/hooks/useTheme";

export type ProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
  EditProfile: undefined;
  PrivacySettings: undefined;
  NotificationSettings: undefined;
  AppearanceSettings: undefined;
  BlockedUsers: undefined;
  TeacherJournal: undefined;
  Grades: undefined;
  ClassList: undefined;
  MyGifts: undefined;
  UserProfile: {
    userId: number;
    firstName: string;
    lastName: string;
    username: string;
    avgGrade?: number;
  };
};

const Stack = createStackNavigator<ProfileStackParamList>();

export default function ProfileStackNavigator() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.backgroundRoot },
      }}
    >
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="PrivacySettings"
        component={PrivacySettingsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="AppearanceSettings"
        component={AppearanceSettingsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="BlockedUsers"
        component={BlockedUsersScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="TeacherJournal"
        component={TeacherJournalScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Grades"
        component={GradesScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ClassList"
        component={ClassListScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="MyGifts"
        component={MyGiftsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}