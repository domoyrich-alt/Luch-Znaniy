import React from "react";
import { View, StyleSheet, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Spacing, BorderRadius } from "@/constants/theme";
import { AuthStackParamList } from "@/navigation/AuthStackNavigator";

type WelcomeScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, "Welcome">;

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<WelcomeScreenNavigationProp>();

  return (
    <LinearGradient
      colors={["#7C3AED", "#3B82F6"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={[styles.content, { paddingTop: insets.top + Spacing["4xl"] }]}>
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.textContainer}>
          <ThemedText type="h1" style={styles.title}>
            Luch Znaniy
          </ThemedText>
          <ThemedText type="h4" style={styles.subtitle}>
            Луч Знаний
          </ThemedText>
          <ThemedText type="body" style={styles.description}>
            Единая цифровая экосистема для современной школы
          </ThemedText>
        </View>

        <View style={styles.featuresContainer}>
          <FeatureItem icon="check-circle" text="Отметка присутствия" />
          <FeatureItem icon="book-open" text="Электронный журнал" />
          <FeatureItem icon="calendar" text="Расписание уроков" />
          <FeatureItem icon="coffee" text="Меню столовой" />
        </View>
      </View>

      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <Button
          onPress={() => navigation.navigate("InviteCode")}
          style={styles.button}
        >
          Начать
        </Button>
      </View>
    </LinearGradient>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  const { Feather } = require("@expo/vector-icons");
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIcon}>
        <Feather name={icon} size={20} color="#FFFFFF" />
      </View>
      <ThemedText type="body" style={styles.featureText}>
        {text}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing["2xl"],
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.xl,
  },
  textContainer: {
    alignItems: "center",
    marginBottom: Spacing["4xl"],
  },
  title: {
    color: "#FFFFFF",
    marginBottom: Spacing.xs,
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: Spacing.md,
  },
  description: {
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  featuresContainer: {
    gap: Spacing.lg,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  bottomContainer: {
    paddingHorizontal: Spacing["2xl"],
    paddingTop: Spacing.xl,
  },
  button: {
    backgroundColor: "#FFFFFF",
  },
});
