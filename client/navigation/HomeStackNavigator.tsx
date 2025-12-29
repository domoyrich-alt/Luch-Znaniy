import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "@/screens/HomeScreen";
import GradesScreen from "@/screens/GradesScreen";
import ClassListScreen from "@/screens/ClassListScreen";
import TelegramUserProfileScreen from "@/screens/TelegramUserProfileScreen";
import TeacherJournalScreen from "@/screens/TeacherJournalScreen";
import ScheduleScreen from "@/screens/ScheduleScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type HomeStackParamList = {
  Home: undefined;
  Grades: undefined;
  ClassList: undefined;
  TeacherJournal: undefined;
  Schedule: undefined;
  UserProfile: { userId: number; firstName: string; lastName: string; username: string; avgGrade?: number };
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Luch Znaniy" />,
        }}
      />
      <Stack.Screen
        name="Grades"
        component={GradesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ClassList"
        component={ClassListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="UserProfile"
        component={TelegramUserProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TeacherJournal"
        component={TeacherJournalScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Schedule"
        component={ScheduleScreen}
        options={{ headerTitle: "Расписание" }}
      />
    </Stack.Navigator>
  );
}
