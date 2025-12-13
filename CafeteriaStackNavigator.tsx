import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CafeteriaScreen from "@/screens/CafeteriaScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type CafeteriaStackParamList = {
  Cafeteria: undefined;
};

const Stack = createNativeStackNavigator<CafeteriaStackParamList>();

export default function CafeteriaStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Cafeteria"
        component={CafeteriaScreen}
        options={{ headerTitle: "Столовая" }}
      />
    </Stack.Navigator>
  );
}
