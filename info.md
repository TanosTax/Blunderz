# Blunderz — Техническое описание проекта

## Стек технологий

| Слой | Технология |
|------|-----------|
| Backend | ASP.NET Core 9, C# |
| Real-time | SignalR (WebSocket) |
| ORM | Entity Framework Core + PostgreSQL 16 |
| Frontend | React 19 + Vite |
| UI | Material-UI (MUI) |
| Шахматный движок | chess.js + react-chessboard |
| Анализ | Stockfish (UCI), Ollama (llama3.2) |
| Контейнеризация | Docker Compose |

---

## Архитектура

```
Blunderz/
├── ChessBackend/          # ASP.NET Core API
│   ├── Controllers/       # REST эндпоинты
│   ├── Hubs/              # SignalR хаб (ChessHub)
│   ├── Services/          # Бизнес-логика
│   ├── Models/            # Сущности БД
│   └── Migrations/        # EF Core миграции
└── ChessFrontend/         # React SPA
    └── src/
        ├── components/    # UI компоненты
        ├── hooks/         # Custom React hooks
        ├── services/      # API + SignalR клиенты
        └── stores/        # Состояние приложения
```

---

## Функциональность

### Аутентификация (`/api/auth`)

- Регистрация по логину/паролю/email
- Вход в аккаунт
- Гостевой режим — мгновенная игра без регистрации (генерируется `Guest_XXXXXXXX`)
- Пароли хранятся в виде SHA-256 хэша

### Пользователи (`/api/users`)

- Профиль игрока со статистикой (победы, поражения, ничьи, партий сыграно)
- Раздельные рейтинги Elo по контролям времени: Bullet, Blitz, Rapid, Classical
- Отдельный рейтинг для задач (Puzzle Rating)
- Таблица лидеров с фильтрацией по категории (`/api/users/leaderboard?category=blitz`)
- Поиск пользователя по Telegram ID

### Матчмейкинг (`/api/matchmaking`)

- Автоматический подбор соперника по рейтингу (диапазон ±200 Elo по умолчанию)
- Очередь поиска с учётом контроля времени
- Случайное распределение цветов
- Защита от дублирования: если у игрока уже есть активная партия — возвращается она

### Игровой процесс (SignalR Hub `/hubs/chess`)

Все игровые события передаются в реальном времени через WebSocket.

**Методы (клиент → сервер):**

| Метод | Описание |
|-------|----------|
| `JoinGame(gameId)` | Подключиться к партии |
| `MakeMove(gameId, san, fen, whiteTime, blackTime)` | Сделать ход |
| `ResignGame(gameId, playerId)` | Сдаться |
| `OfferDraw(gameId, playerId)` | Предложить ничью |
| `AcceptDraw(gameId)` | Принять ничью |
| `DeclineDraw(gameId)` | Отклонить ничью |
| `ActivateBerserk(gameId, playerId)` | Активировать берсерк |
| `ClaimVictory(gameId, winnerId)` | Забрать победу при отключении соперника |
| `OfferDrawAfterDisconnect(gameId)` | Предложить ничью при отключении |
| `SendChatMessage(gameId, playerId, message)` | Отправить сообщение в чат |
| `Heartbeat(gameId, playerId)` | Подтверждение соединения |
| `JoinGameAsSpectator(gameId)` | Подключиться как зритель |

**События (сервер → клиент):**

| Событие | Описание |
|---------|----------|
| `MoveMade` | Ход сделан (san, fen, время обоих игроков) |
| `GameEnded` | Партия завершена (результат, изменения рейтинга) |
| `DrawOffered` | Предложена ничья |
| `DrawDeclined` | Ничья отклонена |
| `BerserkActivated` | Берсерк активирован |
| `ChatMessageReceived` | Новое сообщение в чате |
| `FriendRequestReceived` | Входящий запрос в друзья |
| `FriendRequestAccepted` | Запрос принят |

### Контроль времени

- Поддерживаемые форматы: Bullet (< 3 мин), Blitz (3–10 мин), Rapid (10–30 мин), Classical (30+ мин)
- Таймер замораживается до первого хода
- Синхронизация времени при переподключении
- Автоматическое поражение при истечении времени

### Берсерк-режим

- Игрок может активировать до своего первого хода (белые) или второго хода (чёрные)
- Время игрока уменьшается вдвое
- Изменение рейтинга Elo удваивается
- Визуальная индикация в интерфейсе

### Рейтинговая система

- Формула Elo с учётом контроля времени
- Берсерк-модификатор (×2 к изменению рейтинга)
- Рейтинг не меняется при менее чем 2 ходах (защита от абьюза)
- Дружеские партии (`IsRanked = false`) не влияют на рейтинг

### Обработка отключений

- Heartbeat каждые N секунд для отслеживания соединения
- Детектирование отключения через 15 секунд
- Через 2 минуты после отключения соперника — возможность забрать победу или согласиться на ничью
- Фоновый сервис `DisconnectTimeoutService` обрабатывает таймауты

### История партий (`/api/games`)

- Полная история с пагинацией (по 20 партий на страницу)
- Фильтрация по результату: победа / поражение / ничья
- Хранение PGN и FEN каждого хода
- Просмотр активных партий в реальном времени

### Повтор партии (Game Replay)

- Навигация по ходам (вперёд / назад / в начало / в конец)
- Клик по ходу в нотации для перехода к позиции
- Отображение информации о партии и игроках

### Анализ партий (`/api/analysis`)

- Анализ позиции по FEN через Stockfish (глубина настраивается, по умолчанию 20)
- Полный анализ партии по Game ID
- Классификация ходов: Brilliant / Great / Best / Good / Inaccuracy / Mistake / Blunder
- Метрики точности игры для каждого игрока

### AI Coach (`/api/aicoach`)

- Анализ партии через Ollama (llama3.2, работает локально)
- Персонализированная обратная связь на основе данных Stockfish + PGN
- Определение слабых фаз игры (дебют / миттельшпиль / эндшпиль)
- Разбор критических моментов
- Интерактивный чат с тренером по конкретной партии
- Поддержка языков: EN / RU

### Задачи (Puzzles) (`/api/puzzles`)

- Случайная задача с учётом рейтинга пользователя
- Проверка решения и запись попытки
- Рейтинговая система для задач (отдельный Puzzle Rating)
- Фильтрация задач по теме
- Статистика решённых задач

### Система друзей (`/api/friends`)

- Отправка / принятие / отклонение запросов в друзья
- Список друзей с рейтингом и статистикой
- Входящие и исходящие запросы
- Удаление из друзей
- Real-time уведомления через SignalR

### Вызовы (Challenges) (`/api/challenges`)

- Вызов конкретного игрока на партию
- Выбор контроля времени
- Срок действия вызова (ExpiresAt)
- Статусы: Pending / Accepted / Declined / Cancelled / Expired

### Чат в партии

- Сообщения в реальном времени через SignalR
- Фильтрация нецензурных слов
- Ограничение длины сообщения (500 символов)
- История чата сохраняется в БД

### Режим зрителя

- Подключение к любой активной партии как зритель
- Получение всех игровых событий в реальном времени (ходы, завершение)

### Интерфейс

- Полностью адаптивный дизайн (mobile / tablet / desktop)
- Поддержка landscape-режима
- Тёмная тема
- Настройка внешнего вида доски
- Звуковые эффекты
- Анимированные прогресс-бары таймеров
- Индикаторы соединения (зелёный / серый)
- Переключатель языка (EN / RU)

---

## База данных

| Таблица | Назначение |
|---------|-----------|
| `Users` | Пользователи, рейтинги, статистика |
| `Games` | Партии, PGN, FEN, результаты, таймеры |
| `Moves` | История ходов каждой партии |
| `MatchmakingQueue` | Очередь поиска игры |
| `ChatMessages` | Сообщения в чате партий |
| `Friendships` | Связи между пользователями |
| `Challenges` | Вызовы на партию |
| `Puzzles` | Шахматные задачи |
| `UserPuzzleAttempts` | Попытки решения задач |
| `GameAnalysis` | Результаты анализа Stockfish |
| `PositionAnalysis` | Анализ отдельных позиций |

---

## REST API — сводная таблица

```
POST   /api/auth/register                  Регистрация
POST   /api/auth/login                     Вход
POST   /api/auth/guest                     Гостевой аккаунт

GET    /api/users/{id}                     Профиль пользователя
GET    /api/users/telegram/{telegramId}    Поиск по Telegram ID
GET    /api/users/leaderboard              Таблица лидеров

POST   /api/matchmaking/join               Войти в очередь
DELETE /api/matchmaking/leave/{userId}     Выйти из очереди

GET    /api/games/{id}                     Получить партию
GET    /api/games/{id}/chat                История чата партии
GET    /api/games/user/{userId}            Все партии пользователя
GET    /api/games/user/{userId}/history    История с фильтрами и пагинацией
GET    /api/games/active                   Активные партии
POST   /api/games/{id}/start               Начать партию
POST   /api/games/{id}/end                 Завершить партию

POST   /api/analysis/position              Анализ позиции (FEN)
POST   /api/analysis/game/{gameId}         Анализ партии (Stockfish)

POST   /api/aicoach/analyze/{gameId}       AI-анализ партии (Ollama)
POST   /api/aicoach/chat                   Чат с AI-тренером

GET    /api/puzzles/random                 Случайная задача
POST   /api/puzzles/check                  Проверить решение
GET    /api/puzzles/stats/{userId}         Статистика задач
GET    /api/puzzles/theme/{theme}          Задачи по теме

GET    /api/friends/{userId}               Список друзей
GET    /api/friends/{userId}/requests      Запросы в друзья
POST   /api/friends/request                Отправить запрос
POST   /api/friends/accept/{id}            Принять запрос
POST   /api/friends/reject/{id}            Отклонить запрос
DELETE /api/friends/{id}                   Удалить из друзей

GET    /api/challenges/pending/{userId}    Активные вызовы
```

---

## Запуск проекта

### Требования

- .NET 9 SDK
- Node.js 18+ и pnpm
- PostgreSQL 16 (или Docker)
- Ollama (опционально, для AI Coach)

### Через Docker Compose (БД)

```bash
docker-compose up -d
```

### Backend

```bash
cd ChessBackend
cp ../.env.example .env  # настроить переменные
dotnet ef database update
dotnet run
# → http://localhost:5049
```

### Frontend

```bash
cd ChessFrontend
pnpm install
pnpm dev
# → http://localhost:5173
```

### AI Coach (опционально)

```bash
# Установить Ollama: https://ollama.ai/download
ollama serve
ollama pull llama3.2
```

---

## Переменные окружения

```env
ConnectionStrings__DefaultConnection=Host=localhost;Database=chessdb;Username=postgres;Password=...
JWT_SECRET=your-secret-key-min-32-characters
JWT_ISSUER=ChessBackend
JWT_AUDIENCE=ChessFrontend
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
Ollama__Url=http://localhost:11434
REDIS_CONNECTION=localhost:6379  # опционально
```
