import React from "react";
import { View, StyleSheet, Image, Animated } from "react-native";
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
    <View style={styles.container}>
      <LinearGradient
        colors={["#0a0a1a", "#1a0a2e", "#0f0f23"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.glowOrb1} />
      <View style={styles.glowOrb2} />
      <View style={styles.glowOrb3} />

      <View style={[styles.content, { paddingTop: insets.top + Spacing["4xl"] }]}>
        <View style={styles.logoContainer}>
          <View style={styles.logoGlow}>
            <Image
              source={require("../../assets/images/icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </View>

        <View style={styles.textContainer}>
          <ThemedText type="h1" style={styles.title}>
            Луч Знаний
          </ThemedText>
          <View style={styles.subtitleContainer}>
            <ThemedText type="h4" style={styles.subtitle}>
              LUCH ZNANIY
            </ThemedText>
          </View>
          <ThemedText type="body" style={styles.description}>
            Цифровое будущее образования начинается здесь
          </ThemedText>
        </View>

        <View style={styles.decorContainer}>
          <View style={styles.neonLine} />
          <View style={styles.neonDot} />
          <View style={styles.neonLine} />
        </View>
      </View>

      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <Button
          onPress={() => navigation.navigate("InviteCode")}
          style={styles.button}
          textStyle={styles.buttonText}
        >
          Войти в систему
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a1a",
  },
  glowOrb1: {
    position: "absolute",
    top: "10%",
    left: "-20%",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#7C3AED",
    opacity: 0.15,
  },
  glowOrb2: {
    position: "absolute",
    top: "40%",
    right: "-30%",
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: "#00D4FF",
    opacity: 0.1,
  },
  glowOrb3: {
    position: "absolute",
    bottom: "5%",
    left: "10%",
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "#FF00FF",
    opacity: 0.08,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing["2xl"],
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  logoGlow: {
    padding: 4,
    borderRadius: BorderRadius.xl + 4,
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#00D4FF",
    shadowColor: "#00D4FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.xl,
  },
  textContainer: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  title: {
    color: "#FFFFFF",
    fontSize: 42,
    fontWeight: "700",
    textShadowColor: "#7C3AED",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginBottom: Spacing.md,
  },
  subtitleContainer: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(0, 212, 255, 0.5)",
    marginBottom: Spacing.xl,
  },
  subtitle: {
    color: "#00D4FF",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 4,
    textShadowColor: "#00D4FF",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  description: {
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
  },
  decorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  neonLine: {
    width: 60,
    height: 2,
    backgroundColor: "#FF00FF",
    shadowColor: "#FF00FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  neonDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#00D4FF",
    shadowColor: "#00D4FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  bottomContainer: {
    paddingHorizontal: Spacing["2xl"],
    paddingTop: Spacing.xl,
  },
  button: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#7C3AED",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    textShadowColor: "#7C3AED",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});
