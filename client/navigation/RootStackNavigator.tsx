import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import AuthStackNavigator from "@/navigation/AuthStackNavigator";
import HomeworkModal from "@/screens/HomeworkModal";
import EventsModal from "@/screens/EventsModal";
import AnnouncementsModal from "@/screens/AnnouncementsModal";
import GradesScreen from "@/screens/GradesScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useAuth } from "@/context/AuthContext";

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  HomeworkModal: undefined;
  EventsModal: undefined;
  AnnouncementsModal: undefined;
  GradesTab: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const { isAuthenticated } = useAuth();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {isAuthenticated ? (
        <>
          <Stack.Screen
            name="Main"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="HomeworkModal"
            component={HomeworkModal}
            options={{
              presentation: "modal",
              headerTitle: "Домашние задания",
            }}
          />
          <Stack.Screen
            name="EventsModal"
            component={EventsModal}
            options={{
              presentation: "modal",
              headerTitle: "Мероприятия",
            }}
          />
          <Stack.Screen
            name="AnnouncementsModal"
            component={AnnouncementsModal}
            options={{
              presentation: "modal",
              headerTitle: "Новости",
            }}
          />
          <Stack.Screen
            name="GradesTab"
            component={GradesScreen}
            options={{
              presentation: "modal",
              headerTitle: "Оценки",
            }}
          />
        </>
      ) : (
        <Stack.Screen
          name="Auth"
          component={AuthStackNavigator}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
}
