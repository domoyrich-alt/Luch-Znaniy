/**
 * TELEGRAM MEDIA GALLERY
 * Галерея медиа для поиска по типу файлов
 * 
 * Фильтры:
 * - Фото
 * - Видео
 * - Файлы
 * - Голосовые
 * - Ссылки
 * 
 * Особенности:
 * - Grid layout для фото/видео
 * - List layout для файлов
 * - Быстрая навигация по датам
 * - Индексированный поиск (мгновенно)
 */

import React, { useCallback, useMemo, useState, useRef, memo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  SectionList,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { 
  useSearchStore, 
  MediaFilter, 
  MediaSearchResult,
} from '../../store/SearchStore';
import { ThemedText } from '../ThemedText';

// ==================== ТИПЫ ====================

interface TelegramMediaGalleryProps {
  chatId: string;
  onSelectMedia: (media: MediaSearchResult) => void;
  onClose?: () => void;
}

interface MediaGridItemProps {
  item: MediaSearchResult;
  size: number;
  onPress: () => void;
}

interface MediaListItemProps {
  item: MediaSearchResult;
  onPress: () => void;
}

// ==================== КОНСТАНТЫ ====================

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_COLUMNS = 3;
const GRID_GAP = 2;
const GRID_ITEM_SIZE = (SCREEN_WIDTH - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

const MEDIA_FILTERS: { key: MediaFilter; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: 'photo', label: 'Фото', icon: 'image' },
  { key: 'video', label: 'Видео', icon: 'video' },
  { key: 'file', label: 'Файлы', icon: 'file' },
  { key: 'voice', label: 'Голосовые', icon: 'mic' },
  { key: 'link', label: 'Ссылки', icon: 'link' },
];

// ==================== GRID ITEM (ФОТО/ВИДЕО) ====================

const MediaGridItem: React.FC<MediaGridItemProps> = memo(({ item, size, onPress }) => {
  const [imageError, setImageError] = useState(false);
  
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <TouchableOpacity
      style={[styles.gridItem, { width: size, height: size }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {imageError ? (
        <View style={[styles.gridPlaceholder, { width: size, height: size }]}>
          <Feather
            name={item.mediaType === 'video' ? 'video' : 'image'}
            size={24}
            color="#8E8E93"
          />
        </View>
      ) : (
        <Image
          source={{ uri: item.thumbnailUrl || item.mediaUrl }}
          style={[styles.gridImage, { width: size, height: size }]}
          onError={() => setImageError(true)}
        />
      )}
      
      {/* Иконка видео */}
      {item.mediaType === 'video' && (
        <View style={styles.videoBadge}>
          <Feather name="play" size={12} color="#fff" />
          {item.duration && (
            <ThemedText style={styles.videoDuration}>
              {formatDuration(item.duration)}
            </ThemedText>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
});

// ==================== LIST ITEM (ФАЙЛЫ/ГОЛОСОВЫЕ) ====================

const MediaListItem: React.FC<MediaListItemProps> = memo(({ item, onPress }) => {
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };
  
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString([], { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
    });
  };
  
  const getFileIcon = (): keyof typeof Feather.glyphMap => {
    if (item.mediaType === 'voice') return 'mic';
    
    const extension = item.fileName?.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return 'file-text';
      case 'doc':
      case 'docx': return 'file-text';
      case 'xls':
      case 'xlsx': return 'grid';
      case 'ppt':
      case 'pptx': return 'monitor';
      case 'zip':
      case 'rar':
      case '7z': return 'archive';
      case 'mp3':
      case 'wav':
      case 'ogg': return 'music';
      default: return 'file';
    }
  };
  
  const getFileColor = () => {
    if (item.mediaType === 'voice') return '#34C759';
    
    const extension = item.fileName?.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return '#FF3B30';
      case 'doc':
      case 'docx': return '#007AFF';
      case 'xls':
      case 'xlsx': return '#34C759';
      case 'ppt':
      case 'pptx': return '#FF9500';
      case 'zip':
      case 'rar':
      case '7z': return '#8E8E93';
      default: return '#007AFF';
    }
  };
  
  return (
    <TouchableOpacity style={styles.listItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.fileIcon, { backgroundColor: getFileColor() }]}>
        <Feather name={getFileIcon()} size={20} color="#fff" />
      </View>
      
      <View style={styles.listItemContent}>
        <ThemedText style={styles.fileName} numberOfLines={1}>
          {item.fileName || (item.mediaType === 'voice' ? 'Голосовое сообщение' : 'Файл')}
        </ThemedText>
        
        <View style={styles.listItemMeta}>
          {item.senderName && (
            <ThemedText style={styles.senderName} numberOfLines={1}>
              {item.senderName}
            </ThemedText>
          )}
          
          <ThemedText style={styles.fileMeta}>
            {item.mediaType === 'voice' && item.duration
              ? formatDuration(item.duration)
              : formatFileSize(item.fileSize)}
            {' • '}
            {formatDate(item.timestamp)}
          </ThemedText>
        </View>
      </View>
      
      <TouchableOpacity style={styles.downloadButton}>
        <Feather name="download" size={20} color="#007AFF" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

// ==================== LINK ITEM ====================

const LinkItem: React.FC<MediaListItemProps> = memo(({ item, onPress }) => {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString([], { 
      day: 'numeric', 
      month: 'short',
    });
  };
  
  // Извлекаем домен из URL
  const getDomain = (url: string) => {
    try {
      const { hostname } = new URL(url);
      return hostname.replace('www.', '');
    } catch {
      return url;
    }
  };
  
  return (
    <TouchableOpacity style={styles.linkItem} onPress={onPress} activeOpacity={0.7}>
      {item.thumbnailUrl ? (
        <Image source={{ uri: item.thumbnailUrl }} style={styles.linkThumbnail} />
      ) : (
        <View style={styles.linkIconContainer}>
          <Feather name="link" size={20} color="#007AFF" />
        </View>
      )}
      
      <View style={styles.linkContent}>
        <ThemedText style={styles.linkTitle} numberOfLines={2}>
          {item.fileName || getDomain(item.mediaUrl)}
        </ThemedText>
        
        <ThemedText style={styles.linkDomain} numberOfLines={1}>
          {getDomain(item.mediaUrl)}
        </ThemedText>
        
        <View style={styles.linkMeta}>
          {item.senderName && (
            <ThemedText style={styles.linkSender} numberOfLines={1}>
              {item.senderName}
            </ThemedText>
          )}
          <ThemedText style={styles.linkDate}>
            {formatDate(item.timestamp)}
          </ThemedText>
        </View>
      </View>
      
      <Feather name="chevron-right" size={20} color="#C7C7CC" />
    </TouchableOpacity>
  );
});

// ==================== SECTION HEADER ====================

const DateSectionHeader: React.FC<{ title: string }> = memo(({ title }) => (
  <View style={styles.sectionHeader}>
    <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
  </View>
));

// ==================== ОСНОВНОЙ КОМПОНЕНТ ====================

export const TelegramMediaGallery: React.FC<TelegramMediaGalleryProps> = ({
  chatId,
  onSelectMedia,
  onClose,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<MediaFilter>('photo');
  const listRef = useRef<FlatList>(null);
  
  // Store
  const {
    mediaResults,
    mediaFilter,
    setMediaFilter,
    searchMedia,
    isServerSearching,
  } = useSearchStore();
  
  // Загрузка медиа при смене фильтра
  React.useEffect(() => {
    searchMedia(chatId, selectedFilter);
  }, [chatId, selectedFilter]);
  
  // Группировка по дате
  const sections = useMemo(() => {
    const groups: Map<string, MediaSearchResult[]> = new Map();
    
    mediaResults.forEach(item => {
      const date = new Date(item.timestamp);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      let key: string;
      if (diffDays === 0) {
        key = 'Сегодня';
      } else if (diffDays === 1) {
        key = 'Вчера';
      } else if (diffDays < 7) {
        key = 'На этой неделе';
      } else if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
        key = 'В этом месяце';
      } else {
        key = date.toLocaleDateString([], { month: 'long', year: 'numeric' });
      }
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    });
    
    return Array.from(groups.entries()).map(([title, data]) => ({
      title,
      data,
    }));
  }, [mediaResults]);
  
  // Обработчики
  const handleSelectFilter = useCallback((filter: MediaFilter) => {
    setSelectedFilter(filter);
    setMediaFilter(filter);
    Haptics.selectionAsync();
  }, [setMediaFilter]);
  
  const handleSelectMedia = useCallback((item: MediaSearchResult) => {
    Haptics.selectionAsync();
    onSelectMedia(item);
  }, [onSelectMedia]);
  
  // Рендер элемента
  const renderItem = useCallback(({ item }: { item: MediaSearchResult }) => {
    const handlePress = () => handleSelectMedia(item);
    
    switch (selectedFilter) {
      case 'photo':
      case 'video':
        return (
          <MediaGridItem
            item={item}
            size={GRID_ITEM_SIZE}
            onPress={handlePress}
          />
        );
      
      case 'file':
      case 'voice':
        return <MediaListItem item={item} onPress={handlePress} />;
      
      case 'link':
        return <LinkItem item={item} onPress={handlePress} />;
      
      default:
        return null;
    }
  }, [selectedFilter, handleSelectMedia]);
  
  // Grid или List
  const isGridLayout = selectedFilter === 'photo' || selectedFilter === 'video';
  
  // Key extractor
  const keyExtractor = useCallback((item: MediaSearchResult) => item.id, []);
  
  // Рендер заголовка секции
  const renderSectionHeader = useCallback(({ section }: { section: { title: string } }) => (
    <DateSectionHeader title={section.title} />
  ), []);
  
  return (
    <View style={styles.container}>
      {/* Фильтры */}
      <View style={styles.filtersContainer}>
        {MEDIA_FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterTab,
              selectedFilter === filter.key && styles.filterTabActive,
            ]}
            onPress={() => handleSelectFilter(filter.key)}
          >
            <Feather
              name={filter.icon}
              size={16}
              color={selectedFilter === filter.key ? '#007AFF' : '#8E8E93'}
            />
            <ThemedText
              style={[
                styles.filterTabText,
                selectedFilter === filter.key && styles.filterTabTextActive,
              ]}
            >
              {filter.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Контент */}
      {isServerSearching ? (
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>Загрузка...</ThemedText>
        </View>
      ) : mediaResults.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather
            name={MEDIA_FILTERS.find(f => f.key === selectedFilter)?.icon || 'file'}
            size={48}
            color="#C7C7CC"
          />
          <ThemedText style={styles.emptyTitle}>
            {selectedFilter === 'photo' && 'Нет фотографий'}
            {selectedFilter === 'video' && 'Нет видео'}
            {selectedFilter === 'file' && 'Нет файлов'}
            {selectedFilter === 'voice' && 'Нет голосовых сообщений'}
            {selectedFilter === 'link' && 'Нет ссылок'}
          </ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            В этом чате пока нет {
              selectedFilter === 'photo' ? 'фотографий' :
              selectedFilter === 'video' ? 'видео' :
              selectedFilter === 'file' ? 'файлов' :
              selectedFilter === 'voice' ? 'голосовых сообщений' :
              'ссылок'
            }
          </ThemedText>
        </View>
      ) : isGridLayout ? (
        // Grid Layout для фото/видео
        <FlatList
          ref={listRef}
          data={mediaResults}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          numColumns={GRID_COLUMNS}
          style={styles.gridList}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={18}
          maxToRenderPerBatch={12}
          windowSize={5}
          getItemLayout={(_, index) => ({
            length: GRID_ITEM_SIZE,
            offset: GRID_ITEM_SIZE * Math.floor(index / GRID_COLUMNS),
            index,
          })}
        />
      ) : (
        // List Layout для файлов/ссылок
        <SectionList
          sections={sections}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={keyExtractor}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      )}
    </View>
  );
};

// ==================== СТИЛИ ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  filtersContainer: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
    borderRadius: 8,
  },
  filterTabActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  filterTabText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#007AFF',
  },
  gridList: {
    flex: 1,
  },
  gridContent: {
    gap: GRID_GAP,
  },
  gridItem: {
    marginRight: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  gridImage: {
    backgroundColor: '#E5E5EA',
  },
  gridPlaceholder: {
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 2,
  },
  videoDuration: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    gap: 12,
  },
  fileIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItemContent: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  listItemMeta: {
    marginTop: 2,
  },
  senderName: {
    fontSize: 13,
    color: '#007AFF',
  },
  fileMeta: {
    fontSize: 13,
    color: '#8E8E93',
  },
  downloadButton: {
    padding: 8,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    gap: 12,
  },
  linkThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#E5E5EA',
  },
  linkIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkContent: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
    lineHeight: 20,
  },
  linkDomain: {
    fontSize: 13,
    color: '#007AFF',
    marginTop: 2,
  },
  linkMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  linkSender: {
    fontSize: 12,
    color: '#8E8E93',
    flex: 1,
  },
  linkDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  sectionHeader: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 15,
    color: '#8E8E93',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default TelegramMediaGallery;
