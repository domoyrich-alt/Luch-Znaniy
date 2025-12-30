# Telegram Sound Assets

Эта директория содержит звуковые эффекты для приложения.

## Необходимые файлы

Для полной функциональности нужно добавить следующие звуковые файлы:

1. `sent.mp3` - Звук отправки сообщения (короткий "свуш")
2. `received.mp3` - Звук получения сообщения
3. `notification.mp3` - Звук уведомления
4. `call.mp3` - Звук входящего звонка
5. `typing.mp3` - Звук набора текста (опционально)

## Источники звуков

Звуки можно извлечь из:
- APK файла Telegram (assets/sounds/)
- Telegram Desktop (Resources/sounds/)
- Или использовать собственные звуки схожей стилистики

## Форматы

Рекомендуемый формат: MP3, 44.1kHz, 128kbps
Альтернативы: WAV, OGG

## Использование

```typescript
import { soundService } from '@/utils/soundService';

// Воспроизвести звук отправки
await soundService.playMessageSent();

// Воспроизвести звук получения
await soundService.playMessageReceived();
```

## Fallback

Если звуковые файлы отсутствуют, используется Web Audio API для генерации простых тональных сигналов.
