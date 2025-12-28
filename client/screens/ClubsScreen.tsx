import React, { useState } from "react";
import { View, StyleSheet, FlatList, Pressable, Alert, ActivityIndicator } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

interface Club {
  id: number;
  name: string;
  teacher: string;
  schedule: string;
  participants: number;
  maxParticipants: number;
}

export default function ClubsScreen() {
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [joinedClubs, setJoinedClubs] = useState<Set<number>>(new Set());

  const { data: clubs = [], isLoading } = useQuery<Club[]>({
    queryKey: ["/api/clubs"],
  });

  const joinClubMutation = useMutation({
    mutationFn: async (clubId: number) => {
      const response = await apiRequest("POST", `/api/clubs/${clubId}/join`, {
        studentId: user?.id,
      });
      return response.json();
    },
    onSuccess: (data, clubId) => {
      setJoinedClubs(prev => new Set([...prev, clubId]));
      Alert.alert("Успешно!", "Вы записались в кружок!");
    },
    onError: () => {
      Alert.alert("Ошибка", "Не удалось записаться в кружок");
    },
  });

  const handleJoinClub = async (club: Club) => {
    if (joinedClubs.has(club.id)) {
      Alert.alert("Информация", "Вы уже записаны в этот кружок");
      return;
    }
    
    if (club.participants >= club.maxParticipants) {
      Alert.alert("Извините", "В кружке нет свободных мест");
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    
    Alert.alert(
      "Записаться в кружок? ", 
      `Вы хотите записаться в "${club.name}"?\n\nРасписание: ${club.schedule}\nПреподаватель: ${club.teacher}`,
      [
        { text: "Отмена", style: "cancel" },
        { text: "Записаться", onPress: () => joinClubMutation.mutate(club.id) },
      ]
    );
  };

  const getClubIcon = (name: string) => {
    if (name. toLowerCase().includes("робот")) return "cpu";
    if (name.toLowerCase().includes("театр")) return "theater";
    if (name.toLowerCase().includes("изо") || name.toLowerCase().includes("худож")) return "palette";
    if (name.toLowerCase().includes("математ")) return "calculator";
    if (name.toLowerCase().includes("спорт")) return "activity";
    if (name.toLowerCase().includes("музык")) return "music";
    return "heart";
  };

  const getClubColor = (index: number) => {
    const colors = [Colors.light.primary, Colors.light.success, Colors.light.warning, Colors.light.error, Colors.light.secondary];
    return colors[index % colors.length];
  };

  const renderClub = ({ item, index }: { item: Club; index: number }) => {
    const isJoined = joinedClubs.has(item.id);
    const isFull = item.participants >= item.maxParticipants;
    const clubColor = getClubColor(index);

    return (
      <Card style={styles.clubCard}>
        <View style={styles.clubHeader}>
          <View style={[styles.clubIcon, { backgroundColor: clubColor + "20" }]}>
            <Feather name={getClubIcon(item.name) as any} size={24} color={clubColor} />
          </View>
          <View style={styles.clubInfo}>
            <ThemedText type="h4" style={styles.clubName}>
              {item.name}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {item.teacher}
            </ThemedText>
          </View>
          {isJoined && (
            <View style={[styles.joinedBadge, { backgroundColor: Colors. light.success }]}>
              <Feather name="check" size={16} color="#FFFFFF" />
            </View>
          )}
        </View>

        <View style={styles.clubDetails}>
          <View style={styles.detailRow}>
            <Feather name="clock" size={16} color={theme.textSecondary} />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {item.schedule}
            </ThemedText>
          </View>
          <View style={styles.detailRow}>
            <Feather name="users" size={16} color={theme. textSecondary} />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {item.participants}/{item.maxParticipants} участников
            </ThemedText>
          </View>
        </View>

        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${(item.participants / item.maxParticipants) * 100}%`,
                backgroundColor: isFull ? Colors.light.error : clubColor 
              }
            ]} 
          />
        </View>

        <Pressable
          onPress={() => handleJoinClub(item)}
          disabled={isJoined || joinClubMutation.isPending}
          style={[
            styles.joinButton,
            {
              backgroundColor: isJoined 
                ? Colors.light.success 
                : isFull 
                ?  theme.textSecondary 
                : clubColor,
              opacity: joinClubMutation.isPending ?  0.6 : 1,
            },
          ]}
        >
          {joinClubMutation. isPending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Feather 
                name={isJoined ? "check" : isFull ? "lock" : "plus"} 
                size={16} 
                color="#FFFFFF" 
              />
              <ThemedText type="small" style={{ color: "#FFFFFF", fontWeight: "600" }}>
                {isJoined ? "Записан" : isFull ? "Нет мест" : "Записаться"}
              </ThemedText>
            </>
          )}
        </Pressable>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.emptyState, { paddingTop: headerHeight + Spacing.xl }]}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.lg }}>
            Загрузка кружков...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={clubs}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderClub}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: Spacing.xl, // ИСПРАВЛЕНО: убран insets. bottom
          },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <View style={styles.headerInfo}>
            <Card style={[styles.infoCard, { backgroundColor: theme. primary + "15" }]}>
              <Feather name="info" size={20} color={theme.primary} />
              <ThemedText type="small" style={{ color: theme.primary, flex: 1 }}>
                Выберите кружки по интересам.  Занятия проходят после уроков.
              </ThemedText>
            </Card>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Feather name="heart" size={48} color={theme.textSecondary} />
            <ThemedText type="h4" style={{ color: theme. textSecondary, textAlign: "center" }}>
              Кружки временно недоступны
            </ThemedText>
          </View>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing. lg,
  },
  emptyState: {
    flex:  1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing["2xl"],
    gap: Spacing.lg,
  },
  headerInfo: {
    marginBottom: Spacing.xl,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  clubCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  clubHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  clubIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  clubInfo:  {
    flex: 1,
  },
  clubName: {
    marginBottom: Spacing.xs,
  },
  joinedBadge: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  clubDetails: {
    gap:  Spacing.sm,
    marginBottom: Spacing.md,
  },
  detailRow:  {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing. sm,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.light.border,
    borderRadius: 2,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  joinButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
});