# ♟️ Blunderz

Онлайн шахматная платформа с рейтинговой системой, матчмейкингом и игрой в реальном времени.

## 🎯 О проекте

Blunderz — это веб-приложение для игры в шахматы онлайн с автоматическим подбором соперников, рейтинговой системой Elo и синхронизацией ходов в реальном времени через WebSocket.

## 🛠️ Технологии

### Backend
- **ASP.NET Core 9** — REST API и WebSocket сервер
- **SignalR** — real-time коммуникация между игроками
- **Entity Framework Core** — ORM для работы с БД
- **PostgreSQL 16** — основная база данных
- **JWT Authentication** — авторизация пользователей

### Frontend
- **React 19** — UI библиотека
- **Vite** — сборщик и dev-сервер
- **Material-UI (MUI)** — компоненты интерфейса
- **chess.js** — валидация шахматных ходов
- **react-chessboard** — визуализация доски
- **SignalR Client** — WebSocket клиент

## ✨ Возможности

- ⚡ Игра в реальном времени через WebSocket
- 🎲 Автоматический матчмейкинг по рейтингу
- 📊 Рейтинговая система Elo
- ⏱️ Контроль времени (блиц, рапид, классика)
- 👤 Профили игроков со статистикой
- 🏆 Таблица лидеров
- 🎨 Настраиваемые темы доски
- 🔄 Автоматическое переподключение при разрыве связи
- 👻 Гостевой режим (игра без регистрации)
- 🤖 AI Coach — анализ партий с помощью Ollama (локально, бесплатно)
- 📈 Stockfish анализ — оценка ходов и точность игры
- 🏆 Турниры — олимпийская сетка (single-elimination) с лобби, посевом и архивом

## 🚀 Быстрый старт

### Требования

- .NET 9 SDK
- PostgreSQL 16
- Node.js 18+ и pnpm
- Git

### Установка

```bash
# Клонировать репозиторий
git clone https://github.com/TanosTax/Blunderz.git
cd Blunderz

# Настроить переменные окружения
cp .env.example .env
# Отредактировать .env файл с вашими настройками

# ВАЖНО: Для AI Coach нужен Ollama
# Установить Ollama: https://ollama.ai/download
# Запустить: ollama serve
# Скачать модель: ollama pull llama3.2
```

### Запуск Backend

```bash
cd ChessBackend

# Применить миграции БД
dotnet ef database update

# Запустить сервер
dotnet run
```

Backend будет доступен на `http://localhost:5049`

### Запуск Frontend

```bash
cd ChessFrontend

# Установить зависимости
pnpm install

# Запустить dev-сервер
pnpm dev
```

Frontend будет доступен на `http://localhost:5173`

## 📁 Структура проекта

```
Blunderz/
├── ChessBackend/              # ASP.NET Core API
│   ├── Controllers/           # REST API endpoints
│   ├── Hubs/                  # SignalR hubs
│   ├── Services/              # Бизнес-логика
│   ├── Models/                # Entity модели
│   ├── Data/                  # DbContext и миграции
│   └── Program.cs             # Entry point
│
├── ChessFrontend/             # React приложение
│   ├── src/
│   │   ├── components/        # React компоненты
│   │   ├── hooks/             # Custom hooks
│   │   ├── services/          # API и SignalR клиенты
│   │   ├── styles/            # CSS стили
│   │   └── App.jsx            # Главный компонент
│   └── vite.config.js
│
└── .env.example               # Пример конфигурации
```

## 🗄️ База данных

### Основные таблицы

- **Users** — пользователи, рейтинг, статистика
- **Games** — шахматные партии, PGN, FEN, результаты
- **Moves** — история ходов
- **MatchmakingQueue** — очередь поиска игры
- **Tournaments** — турниры (код комнаты, статус, параметры)
- **TournamentParticipants** — участники и посев
- **TournamentMatches** — пары в сетке, счёт BO1/BO3

### Миграции

```bash
# Создать новую миграцию
dotnet ef migrations add MigrationName

# Применить миграции
dotnet ef database update

# Откатить миграцию
dotnet ef database update PreviousMigrationName
```

## 🔌 API

### REST Endpoints

```
POST   /api/auth/guest          - Создать гостевого пользователя
POST   /api/auth/register       - Регистрация
POST   /api/auth/login          - Вход

GET    /api/users/me            - Текущий пользователь
GET    /api/users/{id}          - Профиль игрока
GET    /api/users/leaderboard   - Таблица лидеров

POST   /api/matchmaking/join    - Войти в очередь поиска
DELETE /api/matchmaking/leave   - Выйти из очереди

GET    /api/games/{id}          - Получить игру
GET    /api/games/active        - Активные игры пользователя

POST   /api/analysis/game/{id}  - Stockfish анализ партии
POST   /api/aicoach/analyze/{id} - AI Coach анализ (Ollama)
```

### SignalR Hub (`/hubs/chess`)

```javascript
// Подключение к игре
connection.invoke('JoinGame', gameId)

// Сделать ход
connection.invoke('MakeMove', gameId, san)

// Сдаться
connection.invoke('Resign', gameId)

// События
connection.on('MoveMade', (data) => { ... })
connection.on('GameOver', (data) => { ... })
connection.on('OpponentConnected', () => { ... })
connection.on('OpponentDisconnected', () => { ... })
```

## 🎮 Игровой процесс

1. Пользователь входит как гость или регистрируется
2. Нажимает "Найти игру" — попадает в очередь матчмейкинга
3. Система подбирает соперника с близким рейтингом
4. Создается игра, оба игрока подключаются через SignalR
5. Игроки делают ходы, которые синхронизируются в реальном времени
6. После завершения партии обновляются рейтинги по формуле Elo

## 🏆 Турниры

Blunderz поддерживает турниры на выбывание (single-elimination). Любой авторизованный пользователь (включая гостевой аккаунт) может создать турнир и стать его организатором.

### Как это работает

1. Организатор создаёт турнир на странице `/tournaments`: задаёт название, уникальный код комнаты (`roomName`), контроль времени, формат матча (BO1 или BO3), перерыв между раундами и опционально пароль для приватного турнира.
2. Игроки находят турнир по коду комнаты или в списке активных турниров и присоединяются в лобби (`/t/{roomName}`).
3. Организатор расставляет посев (drag-and-drop) и запускает турнир — нужно минимум 2 участника.
4. Система генерирует олимпийскую сетку (с bye при неполном числе игроков), создаёт партии и автоматически продвигает победителей.
5. Между раундами — настраиваемая пауза; следующий раунд стартует фоновым планировщиком.
6. Завершённые турниры попадают в архив; старые записи удаляются фоновым сервисом очистки.

### API турниров

```
POST   /api/tournaments                    - Создать турнир
GET    /api/tournaments/active             - Активные турниры
GET    /api/tournaments/completed          - Архив завершённых
GET    /api/tournaments/by-room/{roomName} - Турнир по коду комнаты
POST   /api/tournaments/{id}/join          - Присоединиться
POST   /api/tournaments/{id}/leave         - Покинуть (до старта)
PATCH  /api/tournaments/{id}/seeds         - Изменить посев (только создатель)
POST   /api/tournaments/{id}/start         - Запустить (только создатель)
GET    /api/tournaments/{id}/games         - Партии турнира
```

Турнирные партии не влияют на рейтинг Elo (`isRanked: false`). Ничьи в матче переигрываются до победы одного из игроков.

## 🏗️ Архитектура

### Backend Services

- **GameService** — управление партиями, валидация ходов
- **MatchmakingService** — поиск соперников, создание игр
- **DisconnectTimeoutService** — обработка отключений игроков
- **RatingService** — расчет Elo рейтинга
- **StockfishService** — анализ позиций и партий
- **AICoachService** — персонализированный анализ через Ollama (llama3.2)
- **TournamentService** — создание турниров, сетка, матчи BO1/BO3
- **TournamentRoundSchedulerService** — автоматический запуск следующих раундов
- **TournamentCleanupService** — очистка завершённых турниров из БД

### Frontend Architecture

- **React Hooks** — управление состоянием (useChess, useMatchmaking)
- **SignalR Service** — WebSocket клиент
- **API Service** — HTTP запросы к REST API
- **Chess.js** — валидация ходов на клиенте

## 🔐 Безопасность

- JWT токены для авторизации
- Валидация ходов на сервере
- Проверка прав доступа к играм
- Защита от SQL инъекций через EF Core
- CORS настройки для production

## 📝 Переменные окружения

```bash
# Backend
ConnectionStrings__Default=Host=localhost;Database=chessdb;Username=postgres;Password=yourpassword
JWT_SECRET=your-secret-key-min-32-characters
FRONTEND_URL=http://localhost:5173

# Ollama (для AI Coach, локально)
Ollama__Url=http://localhost:11434

# Frontend (vite)
VITE_API_URL=http://localhost:5049
VITE_SIGNALR_URL=http://localhost:5049/hubs/chess
```

## 🧪 Разработка

### Backend

```bash
# Запуск с hot reload
dotnet watch run

# Тесты
dotnet test

# Форматирование
dotnet format
```

### Frontend

```bash
# Dev сервер
pnpm dev

# Сборка
pnpm build

# Preview production build
pnpm preview
```

## 📦 Production Deploy

```bash
# Backend
dotnet publish -c Release -o ./publish

# Frontend
pnpm build
# Статика в ChessFrontend/dist/
```

## 🤝 Вклад в проект

Pull requests приветствуются! Для крупных изменений сначала откройте issue для обсуждения.

## 📄 Лицензия

MIT

## 👨‍💻 Автор

[TanosTax](https://github.com/TanosTax)
