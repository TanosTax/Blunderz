# Chess Backend API

ASP.NET Core 10 backend для шахматного Telegram Mini App.

## Быстрый старт

### 1. Установка PostgreSQL

Убедись что PostgreSQL установлен и запущен:
```bash
# Проверка
psql --version

# Создание БД
createdb chessdb
```

### 2. Настройка подключения

Обнови `appsettings.json`:
```json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Database=chessdb;Username=postgres;Password=твой_пароль"
}
```

### 3. Применение миграций

```bash
dotnet dotnet-ef database update
```

### 4. Запуск

```bash
dotnet run
```

API будет доступен на `http://localhost:5000`

## API Endpoints

### Users
- `GET /api/users/{id}` - Получить пользователя
- `GET /api/users/telegram/{telegramId}` - По Telegram ID
- `POST /api/users` - Создать пользователя
- `GET /api/users/leaderboard` - Таблица лидеров

### Games
- `GET /api/games/{id}` - Получить игру
- `POST /api/games` - Создать игру
- `GET /api/games/user/{userId}` - Игры пользователя
- `POST /api/games/{id}/start` - Начать игру

### Matchmaking
- `POST /api/matchmaking/join` - Найти игру
- `DELETE /api/matchmaking/leave/{userId}` - Выйти из очереди

### SignalR Hub
- WebSocket: `/hubs/chess`
- Methods: `JoinGame`, `LeaveGame`, `MakeMove`

## Структура

```
ChessBackend/
├── Controllers/       # API контроллеры
├── Services/          # Бизнес-логика
├── Interfaces/        # Интерфейсы сервисов
├── Models/            # Модели БД
├── Data/              # DbContext
├── Hubs/              # SignalR хабы
└── Migrations/        # EF Core миграции
```

## Сервисы

- **EloCalculatorService** - Расчет рейтинга
- **GameService** - Управление играми
- **MatchmakingService** - Поиск игры

## Swagger

Документация API: `http://localhost:5000/swagger`
