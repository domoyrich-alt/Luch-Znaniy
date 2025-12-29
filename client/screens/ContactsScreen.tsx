import React, { useState } from "react";
import { View, StyleSheet, FlatList, Pressable, TextInput } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";

export default function ContactsScreen() {
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const [searchText, setSearchText] = useState("");

  type Contact = {
    id: number;
    name: string;
    role: "student" | "teacher";
    avatar: string;
    isOnline: boolean;
  };

  const contacts: Contact[] = [
    { id: 1, name: "Анна Петрова", role: "student", avatar: "А", isOnline: true },
    { id: 2, name: "Максим Сидоров", role: "student", avatar: "М", isOnline: false },
    { id: 3, name: "Елена Козлова", role: "student", avatar: "Е", isOnline: true },
    { id: 4, name: "Мария Ивановна", role: "teacher", avatar: "М", isOnline: true },
    { id: 5, name: "Динара", role: "teacher", avatar: "Д", isOnline: false },
  ];

  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const renderContact = ({ item }: { item: Contact }) => (
    <Pressable 
      style={[styles.contactItem, { backgroundColor: theme.backgroundDefault }]}
      onPress={() => {
        navigation.navigate('Chat', {
          chatId: `private_${item.id}`,
          chatType: 'private',
          title: item.name,
          isOnline: item.isOnline
        });
      }}
    >
      <View style={[styles.contactAvatar, { backgroundColor: '#4ECDC4' }]}>
        <ThemedText style={styles.contactAvatarText}>{item.avatar}</ThemedText>
        {item.isOnline && <View style={styles.onlineIndicator} />}
      </View>
      <View style={styles.contactInfo}>
        <ThemedText style={styles. contactName}>{item.name}</ThemedText>
        <ThemedText style={styles.contactRole}>{item.role === 'teacher' ? 'Учитель' : 'Ученик'}</ThemedText>
      </View>
      <Feather name="message-circle" size={20} color={theme.textSecondary} />
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles. header, { paddingTop: headerHeight }]}>
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Поиск контактов..."
            placeholderTextColor={theme.textSecondary}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      <FlatList
        data={filteredContacts}
        renderItem={renderContact}
        keyExtractor={(item) => item.id.toString()}
        style={styles.contactsList}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 15 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F0F0', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 10, gap: 10 },
  searchInput: { flex: 1, fontSize: 16 },
  contactsList: { flex: 1 },
  contactItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  contactAvatar: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginRight: 15, position: 'relative' },
  contactAvatarText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  onlineIndicator: { position: 'absolute', bottom: 2, right: 2, width:  14, height: 14, borderRadius: 7, backgroundColor: '#22C55E', borderWidth: 2, borderColor: '#FFFFFF' },
  contactInfo: { flex: 1 },
  contactName: { fontSize:  16, fontWeight: '600', marginBottom: 2 },
  contactRole: { fontSize: 14, opacity: 0.7 },
});