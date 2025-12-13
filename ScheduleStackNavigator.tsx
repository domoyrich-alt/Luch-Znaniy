import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ScheduleScreen from "@/screens/ScheduleScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type ScheduleStackParamList = {
  Schedule: undefined;
};

const Stack = createNativeStackNavigator<ScheduleStackParamList>();

export default function ScheduleStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Schedule"
        component={ScheduleScreen}
        options={{ headerTitle: "Расписание" }}
      />
    </Stack.Navigator>
  );
}
