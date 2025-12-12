import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ProfileScreen from "@/screens/ProfileScreen";
import AdminScreen from "@/screens/AdminScreen";
import ClassChatScreen from "@/screens/ClassChatScreen";
import LeaderboardScreen from "@/screens/LeaderboardScreen";
import PsychologistChatScreen from "@/screens/PsychologistChatScreen";
import OnlineLessonsScreen from "@/screens/OnlineLessonsScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type ProfileStackParamList = {
  Profile: undefined;
  Admin: undefined;
  ClassChat: undefined;
  Leaderboard: undefined;
  PsychologistChat: undefined;
  OnlineLessons: undefined;
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
    </Stack.Navigator>
  );
}
