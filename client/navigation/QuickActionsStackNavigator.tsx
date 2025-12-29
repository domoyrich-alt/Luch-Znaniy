import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import QuickActionsScreen from "@/screens/QuickActionsScreen";
import TeacherJournalScreen from "@/screens/TeacherJournalScreen";
import GradesScreen from "@/screens/GradesScreen";
import ClassListScreen from "@/screens/ClassListScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type QuickActionsStackParamList = {
  QuickActions: undefined;
  TeacherJournal: undefined;
  Grades: undefined;
  ClassList: undefined;
};

const Stack = createNativeStackNavigator<QuickActionsStackParamList>();

export default function QuickActionsStackNavigator() {
  const screenOptions = useScreenOptions({ transparent: false });

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="QuickActions"
        component={QuickActionsScreen}
        options={{ headerTitle: "Быстрые действия" }}
      />

      <Stack.Screen
        name="TeacherJournal"
        component={TeacherJournalScreen}
        options={{ headerTitle: "Журнал" }}
      />
      <Stack.Screen
        name="Grades"
        component={GradesScreen}
        options={{ headerTitle: "Оценки" }}
      />
      <Stack.Screen
        name="ClassList"
        component={ClassListScreen}
        options={{ headerTitle: "Мой класс" }}
      />
    </Stack.Navigator>
  );
}
