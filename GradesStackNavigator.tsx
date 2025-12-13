import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import GradesScreen from "@/screens/GradesScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type GradesStackParamList = {
  Grades: undefined;
};

const Stack = createNativeStackNavigator<GradesStackParamList>();

export default function GradesStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Grades"
        component={GradesScreen}
        options={{ headerTitle: "Оценки" }}
      />
    </Stack.Navigator>
  );
}
