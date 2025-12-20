import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ChatsListScreen from '@/screens/chats/ChatsListScreen';
import PrivateChatScreen from '@/screens/chats/PrivateChatScreen';
import ChatInfoScreen from '@/screens/chats/ChatInfoScreen';
import NewChatScreen from '@/screens/chats/NewChatScreen';
import SearchMessagesScreen from '@/screens/chats/SearchMessagesScreen';
import { useScreenOptions } from '@/hooks/useScreenOptions';

export type ChatsStackParamList = {
  ChatsList: undefined;
  PrivateChat: { chatId: number };
  ChatInfo: { chatId: number };
  NewChat: undefined;
  SearchMessages: { chatId?: number };
};

const Stack = createNativeStackNavigator<ChatsStackParamList>();

export default function ChatsStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="ChatsList"
        component={ChatsListScreen}
        options={{
          headerTitle: 'Чаты',
        }}
      />
      <Stack.Screen
        name="PrivateChat"
        component={PrivateChatScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ChatInfo"
        component={ChatInfoScreen}
        options={{
          headerTitle: 'Информация о чате',
        }}
      />
      <Stack.Screen
        name="NewChat"
        component={NewChatScreen}
        options={{
          headerTitle: 'Новый чат',
        }}
      />
      <Stack.Screen
        name="SearchMessages"
        component={SearchMessagesScreen}
        options={{
          headerTitle: 'Поиск сообщений',
        }}
      />
    </Stack.Navigator>
  );
}
