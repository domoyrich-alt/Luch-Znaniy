import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TelegramChatsListScreen from "@/screens/TelegramChatsListScreen";
import TelegramChatScreen from "@/screens/TelegramChatScreen";
import TelegramChatProfileScreen from "@/screens/TelegramChatProfileScreen";
import TelegramSearchScreen from "@/screens/TelegramSearchScreen";
import ChatScreen from "@/screens/ChatsScreen";
import ChatScreenNew from "@/screens/ChatScreenNew";
import PrivateChatScreen from "@/screens/PrivateChatScreen";
import ChatInfoScreen from "@/screens/ChatInfoScreen";
import SearchMessagesScreen from "@/screens/SearchMessagesScreen";
import PsychologistChatScreen from "@/screens/PsychologistChatScreen";
import GroupInfoScreen from "@/screens/GroupInfoScreen";
import ContactsScreen from "@/screens/ContactsScreen";
import NewChatScreen from "@/screens/NewChatScreen";
import { useTheme } from "@/hooks/useTheme";

export type ChatsStackParamList = {
  ChatsList: undefined;
  Chat: {
    chatId: string;
    chatType: 'private' | 'group' | 'channel';
    title: string;
    avatar?: {
      backgroundColor: string;
      text: string;
    };
    isOnline?: boolean;
    members?: number;
  };
  ChatNew: {
    chatId: number;
    otherUserId: number;
    otherUserName: string;
  };
  TelegramChat: {
    chatId: number;
    otherUserId: number;
    otherUserName: string;
    highlightMessageId?: string;
    phoneNumber?: string;
    chatType?: 'private' | 'group';
  };
  TelegramSearch: undefined;
  ChatProfile: {
    chatId: string;
    otherUserId?: number;
    otherUserName?: string;
    phoneNumber?: string;
    chatType?: 'private' | 'group';
  };
  PrivateChat: {
    chatId: string;
    chatName: string;
    isOnline?: boolean;
  };
  ChatInfo: {
    chatId: string;
    chatName: string;
    chatType?: 'private' | 'group';
    avatar?: string;
  };
  SearchMessages: {
    chatId?: string;
  };
  PsychologistChat: undefined;
  GroupInfo: {
    groupId: string;
  };
  Contacts: undefined;
  NewChat: undefined;
};

const Stack = createNativeStackNavigator<ChatsStackParamList>();

export default function ChatsStackNavigator() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.backgroundRoot,
        },
        headerTintColor: theme.text,
        headerShadowVisible: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="ChatsList"
        component={TelegramChatsListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TelegramSearch"
        component={TelegramSearchScreen}
        options={{ 
          headerShown: false,
          presentation: 'modal',
          animation: 'fade_from_bottom',
        }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ChatNew"
        component={TelegramChatScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TelegramChat"
        component={TelegramChatScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ChatProfile"
        component={TelegramChatProfileScreen}
        options={{ 
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="PsychologistChat"
        component={PsychologistChatScreen}
        options={{
          title: "Школьный психолог",
          headerBackTitle: "Назад",
        }}
      />
      <Stack.Screen
        name="GroupInfo"
        component={GroupInfoScreen}
        options={{
          title: "О группе",
          headerBackTitle: "Назад",
        }}
      />
      <Stack.Screen
        name="Contacts"
        component={ContactsScreen}
        options={{
          title: "Контакты",
          headerBackTitle: "Назад",
        }}
      />
      <Stack.Screen
        name="NewChat"
        component={NewChatScreen}
        options={{
          title: "Новый чат",
          headerBackTitle: "Отмена",
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="PrivateChat"
        component={PrivateChatScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ChatInfo"
        component={ChatInfoScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SearchMessages"
        component={SearchMessagesScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}