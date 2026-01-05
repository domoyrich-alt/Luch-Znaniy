/**
 * EMOJI PICKER (v2)
 * Клавиатура смайликов с вкладками
 * 
 * Вкладки: 😀 👋 🐱 🍎 ⚽ 🚗 💡 🏁
 * Сетка 8x8 эмодзи
 * Появляется снизу экрана
 */

import React, { useRef, useEffect, useState, useCallback, memo } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Modal,
  Animated,
  FlatList,
  Text,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { 
  TelegramDarkColors as colors, 
  TelegramSizes as sizes,
  TelegramTypography as typography,
  TelegramAnimations as animations,
} from '@/constants/telegramDarkTheme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PICKER_HEIGHT = 320;
const NUM_COLUMNS = 7;
const GRID_PADDING = 16;
const EMOJI_SIZE = Math.floor((SCREEN_WIDTH - GRID_PADDING * 2) / NUM_COLUMNS);

// ======================
// КАТЕГОРИИ ЭМОДЗИ
// ======================
const EMOJI_CATEGORIES = [
  { 
    id: 'recent', 
    icon: '🕐', 
    emojis: [] as string[] 
  },
  { 
    id: 'smileys', 
    icon: '😀', 
    emojis: [
      '😂', '🥰', '😍', '🤔', '😎', '🥳', '😭', '😡',
      '😊', '😁', '😆', '😅', '🤣', '😇', '🙂', '😉',
      '😌', '😋', '🤪', '😜', '🤑', '🤗', '🤭', '🤫',
      '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬',
      '😮‍💨', '🤥', '😔', '😪', '🤤', '😴', '😷', '🤒',
      '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵',
      '🤯', '🤠', '🥸', '😎', '🤓', '🧐', '😤', '😠',
    ]
  },
  { 
    id: 'gestures', 
    icon: '👋', 
    emojis: [
      '👍', '👎', '❤️', '🔥', '🎉', '🙏', '👀', '💯',
      '😘', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌',
      '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
      '👆', '🖕', '👇', '☝️', '✊', '👊', '🤛', '🤜',
      '👏', '🙌', '👐', '🤲', '🤝', '✍️', '💅', '🤳',
      '💪', '🦾', '🦵', '🦶', '👂', '🦻', '👃', '🧠',
      '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄',
    ]
  },
  { 
    id: 'animals', 
    icon: '🐱', 
    emojis: [
      '🐱', '🐶', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
      '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈',
      '🙉', '🙊', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅',
      '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛',
      '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️', '🦂',
      '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐',
      '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋',
    ]
  },
  { 
    id: 'food', 
    icon: '🍎', 
    emojis: [
      '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐',
      '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅',
      '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽',
      '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞',
      '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇',
      '🥓', '🥩', '🍗', '🍖', '🌭', '🍔', '🍟', '🍕',
      '🫓', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗',
    ]
  },
  { 
    id: 'activities', 
    icon: '⚽', 
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉',
      '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍',
      '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿',
      '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌',
      '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '⛹️',
      '🤺', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗',
      '🚴', '🚵', '🎪', '🎭', '🎨', '🎬', '🎤', '🎧',
    ]
  },
  { 
    id: 'travel', 
    icon: '🚗', 
    emojis: [
      '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑',
      '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🛴', '🚲',
      '🛵', '🏍️', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖',
      '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄',
      '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈️',
      '🛫', '🛬', '🛩️', '💺', '🛰️', '🚀', '🛸', '🚁',
      '🛶', '⛵', '🚤', '🛥️', '🛳️', '⛴️', '🚢', '⚓',
    ]
  },
  { 
    id: 'objects', 
    icon: '💡', 
    emojis: [
      '💡', '🔦', '🏮', '🪔', '📱', '📲', '💻', '⌨️',
      '🖥️', '🖨️', '🖱️', '🖲️', '💽', '💾', '💿', '📀',
      '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞',
      '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️',
      '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋',
      '🔌', '💎', '🔮', '🧲', '🪙', '💰', '💳', '💴',
      '💵', '💶', '💷', '💸', '🛒', '🛍️', '🎁', '🎀',
    ]
  },
  { 
    id: 'symbols', 
    icon: '🏁', 
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
      '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖',
      '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️',
      '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈',
      '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐',
      '♑', '♒', '♓', '🆔', '⚛️', '☢️', '☣️', '📴',
      '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚',
    ]
  },
];

// ======================
// EMOJI ITEM
// ======================
const EmojiItem = memo(function EmojiItem({
  emoji,
  onPress,
}: {
  emoji: string;
  onPress: () => void;
}) {
  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.emojiItem,
        pressed && { backgroundColor: colors.surface },
      ]}
      onPress={handlePress}
    >
      <Text style={styles.emojiText}>{emoji}</Text>
    </Pressable>
  );
});

// ======================
// CATEGORY TAB
// ======================
const CategoryTab = memo(function CategoryTab({
  category,
  isActive,
  onPress,
}: {
  category: typeof EMOJI_CATEGORIES[0];
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.categoryTab,
        isActive && styles.categoryTabActive,
      ]}
      onPress={onPress}
    >
      <Text style={styles.categoryIcon}>{category.icon}</Text>
    </Pressable>
  );
});

// ======================
// EMOJI PICKER
// ======================
interface EmojiPickerProps {
  visible: boolean;
  onClose: () => void;
  onEmojiSelect: (emoji: string) => void;
  /** Позиция курсора для вставки эмодзи */
  cursorPosition?: number;
  /** Текущий текст сообщения */
  messageText?: string;
  /** Коллбэк для установки полного текста с эмодзи на нужной позиции */
  onTextWithEmoji?: (text: string, newCursorPosition: number) => void;
}

export const EmojiPicker = memo(function EmojiPicker({
  visible,
  onClose,
  onEmojiSelect,
  cursorPosition,
  messageText = '',
  onTextWithEmoji,
}: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState('smileys');
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  
  const slideAnim = useRef(new Animated.Value(PICKER_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: animations.durationFast,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 300,
          friction: 25,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: animations.durationFast,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: PICKER_HEIGHT,
          duration: animations.durationNormal,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleEmojiPress = useCallback((emoji: string) => {
    // Добавляем в недавние
    setRecentEmojis(prev => {
      const filtered = prev.filter(e => e !== emoji);
      return [emoji, ...filtered].slice(0, 32);
    });
    
    // Если есть позиция курсора и коллбэк, вставляем на позицию
    if (onTextWithEmoji && cursorPosition !== undefined) {
      const before = messageText.substring(0, cursorPosition);
      const after = messageText.substring(cursorPosition);
      const newText = before + emoji + after;
      const newCursorPos = cursorPosition + emoji.length;
      onTextWithEmoji(newText, newCursorPos);
    } else {
      // Обычная вставка в конец
      onEmojiSelect(emoji);
    }
  }, [onEmojiSelect, cursorPosition, messageText, onTextWithEmoji]);

  const handleCategoryPress = useCallback((categoryId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveCategory(categoryId);
  }, []);

  // Получаем эмодзи для текущей категории
  const currentCategory = EMOJI_CATEGORIES.find(c => c.id === activeCategory);
  const emojisToShow = activeCategory === 'recent' 
    ? recentEmojis 
    : currentCategory?.emojis || [];

  const renderEmoji = useCallback(({ item }: { item: string }) => (
    <EmojiItem emoji={item} onPress={() => handleEmojiPress(item)} />
  ), [handleEmojiPress]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Animated.View 
        style={[
          styles.backdrop,
          { opacity: backdropAnim },
        ]}
      >
        <Pressable style={styles.backdropPressable} onPress={onClose} />
      </Animated.View>

      {/* Picker */}
      <Animated.View
        style={[
          styles.pickerContainer,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Header с кнопкой закрытия */}
        <View style={styles.pickerHeader}>
          <ThemedText style={styles.pickerTitle}>Эмодзи</ThemedText>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Feather name="x" size={24} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Категории */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {EMOJI_CATEGORIES.map(category => (
            <CategoryTab
              key={category.id}
              category={category}
              isActive={activeCategory === category.id}
              onPress={() => handleCategoryPress(category.id)}
            />
          ))}
        </ScrollView>

        {/* Сетка эмодзи */}
        <FlatList
          data={emojisToShow}
          renderItem={renderEmoji}
          keyExtractor={(item, index) => `${item}-${index}`}
          numColumns={NUM_COLUMNS}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.emojiGrid}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>
                {activeCategory === 'recent' 
                  ? 'Нет недавних эмодзи' 
                  : 'Нет эмодзи'}
              </ThemedText>
            </View>
          }
        />
      </Animated.View>
    </Modal>
  );
});

// ======================
// СТИЛИ
// ======================
const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropPressable: {
    flex: 1,
  },
  
  pickerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: PICKER_HEIGHT,
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D2D',
  },
  pickerTitle: {
    ...typography.titleSmall,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  
  categoriesContainer: {
    maxHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D2D',
  },
  categoriesContent: {
    paddingHorizontal: 12,
  },
  
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#3390EC',
  },
  categoryIcon: {
    fontSize: 22,
  },
  
  emojiGrid: {
    paddingHorizontal: GRID_PADDING,
    paddingTop: 12,
    paddingBottom: 20,
  },
  
  emojiItem: {
    width: EMOJI_SIZE,
    height: EMOJI_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  emojiText: {
    fontSize: Math.min(28, EMOJI_SIZE - 12),
    textAlign: 'center',
  },
  
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    ...typography.bodyMedium,
    color: '#707579',
  },
});

export default EmojiPicker;
