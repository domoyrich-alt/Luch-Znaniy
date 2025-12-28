import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import WelcomeScreen from "@/screens/WelcomeScreen";
import InviteCodeScreen from "@/screens/InviteCodeScreen";
import RegisterProfileScreen from "@/screens/RegisterProfileScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type AuthStackParamList = {
  Welcome: undefined;
  InviteCode: undefined;
  RegisterProfile: { userId: number; firstName: string; lastName: string };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Welcome"
        component={WelcomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="InviteCode"
        component={InviteCodeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RegisterProfile"
        component={RegisterProfileScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}