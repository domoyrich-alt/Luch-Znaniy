import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View } from "react-native";
import HomeStackNavigator from "@/navigation/HomeStackNavigator";
import ScheduleStackNavigator from "@/navigation/ScheduleStackNavigator";
import CheckInStackNavigator from "@/navigation/CheckInStackNavigator";
import CafeteriaStackNavigator from "@/navigation/CafeteriaStackNavigator";
import ProfileStackNavigator from "@/navigation/ProfileStackNavigator";
import { useTheme } from "@/hooks/useTheme";
import { Colors, BorderRadius, Spacing } from "@/constants/theme";

export type MainTabParamList = {
  HomeTab: undefined;
  ScheduleTab: undefined;
  CheckInTab: undefined;
  CafeteriaTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        tabBarActiveTintColor: theme.tabIconSelected,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.select({
            ios: "transparent",
            android: theme.backgroundRoot,
          }),
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          title: "Главная",
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ScheduleTab"
        component={ScheduleStackNavigator}
        options={{
          title: "Расписание",
          tabBarIcon: ({ color, size }) => (
            <Feather name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="CheckInTab"
        component={CheckInStackNavigator}
        options={{
          title: "Отметка",
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={[
                styles.checkInTab,
                {
                  backgroundColor: focused
                    ? Colors.light.primary
                    : theme.backgroundSecondary,
                },
              ]}
            >
              <Feather
                name="check-circle"
                size={24}
                color={focused ? "#FFFFFF" : color}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="CafeteriaTab"
        component={CafeteriaStackNavigator}
        options={{
          title: "Столовая",
          tabBarIcon: ({ color, size }) => (
            <Feather name="coffee" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          title: "Профиль",
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  checkInTab: {
    width: Spacing.fabSize,
    height: Spacing.fabSize,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing["2xl"],
  },
});
