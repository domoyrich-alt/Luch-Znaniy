import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CheckInScreen from "@/screens/CheckInScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type CheckInStackParamList = {
  CheckIn: undefined;
};

const Stack = createNativeStackNavigator<CheckInStackParamList>();

export default function CheckInStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="CheckIn"
        component={CheckInScreen}
        options={{ headerTitle: "Присутствие" }}
      />
    </Stack.Navigator>
  );
}
