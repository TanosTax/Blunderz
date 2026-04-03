# Chess Frontend

React фронтенд для шахматного Telegram Mini App.

## Установка

```bash
pnpm install
```

## Необходимые пакеты

```bash
pnpm install chess.js react-chessboard @microsoft/signalr @tma.js/sdk
```

## Запуск

```bash
pnpm run dev
```

Приложение будет доступно на `http://localhost:5173`

## Структура

```
src/
├── components/          # React компоненты
│   ├── ChessBoard.jsx   # Шахматная доска
│   ├── Matchmaking.jsx  # Поиск игры
│   ├── Profile.jsx      # Профиль игрока
│   └── Leaderboard.jsx  # Таблица лидеров
├── hooks/               # Custom hooks
│   └── useChess.js      # Логика шахмат + SignalR
├── services/            # API сервисы
│   ├── apiService.js    # REST API
│   └── signalRService.js # WebSocket
└── App.jsx              # Главный компонент
```

## Основные компоненты

### ChessBoard
Интерактивная шахматная доска с:
- Drag & drop ходов
- Подсветкой возможных ходов
- Историей партии
- Проверкой шаха/мата

### Matchmaking
Поиск игры с настройками:
- Выбор контроля времени
- Диапазон рейтинга
- Автоматический поиск оппонента

### Profile
Профиль игрока:
- Статистика (рейтинг, игры, победы)
- История партий
- Win rate

### Leaderboard
Таблица лидеров с топ-50 игроками

## API Endpoints

Backend должен быть запущен на `http://localhost:5049`

## Технологии

- React 19
- Vite
- chess.js - шахматная логика
- react-chessboard - UI доски
- SignalR - WebSocket для реального времени
- React Router - навигация

## Development

Для разработки используется mock Telegram ID (123456789).
В продакшене будет использоваться реальный Telegram WebApp API.

## TODO

- [ ] Интеграция Telegram WebApp SDK
- [ ] Таймеры для партий
- [ ] Звуковые эффекты
- [ ] Анимации ходов
- [ ] Чат в игре
- [ ] Турниры
