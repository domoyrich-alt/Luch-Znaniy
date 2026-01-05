# Telegram-Style Chat Design Implementation

## Overview
This document describes the Telegram-style design implementation for the chat screens in the Luch-Znaniy application.

## Color Scheme

### Purple Theme
The new design uses purple accents throughout, replacing the previous blue/teal theme:

- **Primary Purple**: `#8B5CF6` - Used for own messages, buttons, and interactive elements
- **Secondary Purple**: `#A855F7` - Used for hover states and gradients
- **Accent Purple**: `#7C3AED` - Used for deeper shades

### Message Backgrounds
- **Own Messages**: `#8B5CF6` (purple)
- **Incoming Messages**: `#2A2A2A` (dark gray)
- **System Messages**: Semi-transparent background

### Background Colors
- **Chat Background (Dark)**: `#0E0E0E` with subtle pattern overlay
- **Chat Background (Light)**: `#E5DDD5` (Telegram-like beige)

## Components

### 1. TelegramChatHeader
**Location**: `client/components/chat/TelegramChatHeader.tsx`

Features:
- Back button on the left
- Contact name centered
- Status text below name (e.g., "online", "last seen recently")
- Circular avatar on the right
- Clean, minimalist design

Props:
```typescript
interface TelegramChatHeaderProps {
  title: string;
  status?: string;
  avatar?: { backgroundColor: string; text: string };
  onBackPress: () => void;
  onAvatarPress?: () => void;
}
```

### 2. TelegramMessageBubble
**Location**: `client/components/chat/TelegramMessageBubble.tsx`

Features:
- Purple background for own messages (#8B5CF6)
- Dark gray background for incoming messages (#2A2A2A)
- Time displayed inside bubble (bottom right)
- Read receipts (✓✓) for own messages
- Support for replies with colored left border
- "edited" label for edited messages
- Support for text, file, and voice message types
- Avatar display for group chats

Message Types:
- `text` - Standard text message
- `system` - System notification (centered)
- `file` - File attachment with icon
- `voice` - Voice message with waveform

### 3. TelegramInputBar
**Location**: `client/components/chat/TelegramInputBar.tsx`

Features:
- Paperclip button for attachments (left)
- Text input field (center)
- Emoji button (right of input)
- Microphone/Send button (far right)
- Reply preview above input
- Voice recording mode with timer

Props:
```typescript
interface TelegramInputBarProps {
  messageText: string;
  onMessageTextChange: (text: string) => void;
  onSend: () => void;
  onAttach?: () => void;
  onEmoji?: () => void;
  onVoiceStart?: () => void;
  onVoiceStop?: () => void;
  isRecording?: boolean;
  recordingDuration?: number;
  replyTo?: ReplyMessage | null;
  onCancelReply?: () => void;
}
```

## Screen Implementations

### ChatsScreen.tsx
**Location**: `client/screens/ChatsScreen.tsx`

The main chat view now uses the Telegram-style components:
1. TelegramChatHeader at the top
2. Message list with TelegramMessageBubble components
3. TelegramInputBar at the bottom
4. Wallpaper background pattern
5. Typing indicator with purple accents
6. Scroll-to-bottom button

### ChatsListScreen.tsx
**Location**: `client/screens/ChatsListScreen.tsx`

Updated header design:
1. "Edit" button on the left
2. "Chats" title with folder icon centered
3. Search and new chat buttons on the right (purple)
4. Floating action button (FAB) in purple

## Design Guidelines

### Message Bubbles
- **Alignment**: Own messages right-aligned, incoming messages left-aligned
- **Border Radius**: 16px for bubbles, 4px for top-right corner of own messages (Telegram style)
- **Spacing**: 2px vertical spacing between messages, 8px horizontal margin
- **Max Width**: 75% of screen width

### Typography
- **Message Text**: 15px, line height 20px
- **Time**: 11px
- **Status**: 13px, secondary color
- **Header Title**: 16px, weight 600
- **Header Status**: 13px, secondary color

### Interactions
- **Long Press**: Show context menu (reply, copy, delete)
- **Press Animation**: Scale to 0.98
- **Fade In**: 300ms animation for new messages

### Icons
- Read receipts: MaterialIcons "done-all" (✓✓)
- Purple color for read: `#A855F7`
- Gray color for delivered: `rgba(255,255,255,0.5)`

## Migration Notes

### Backward Compatibility
- The old `AnimatedMessage` component is kept in ChatsScreen.tsx for list view compatibility
- Existing chat data structures are preserved
- All hooks (useChat, useTyping, useMessages) continue to work without changes

### Breaking Changes
None - this is a visual redesign that maintains API compatibility.

## Future Enhancements

Potential additions:
1. Sticker/GIF picker with tabs
2. Attachment menu with gallery preview
3. Link preview in messages
4. Voice message playback with progress
5. Video note recording
6. Animation effects for sent messages

## Testing Checklist

- [ ] Message sending/receiving
- [ ] Voice recording
- [ ] Reply functionality
- [ ] Read receipts
- [ ] Typing indicator
- [ ] Chat list navigation
- [ ] Search functionality
- [ ] Dark/Light theme support
- [ ] Keyboard handling
- [ ] Scroll to bottom
- [ ] Long press context menu

## Credits

Design inspired by Telegram Messenger's clean and intuitive interface.
