Telegram Chess Mini App (C# + PostgreSQL)
🎯 Описание проекта

Telegram Mini App для игры в шахматы в реальном времени с собственной рейтинговой системой, турнирами и матчмейкингом. Backend на ASP.NET Core 9, PostgreSQL 16, SignalR WebSocket, React frontend.
🛠️ Технологический стек
Компонент	Технология
Backend	ASP.NET Core 9
База данных	PostgreSQL 16
Кэш/PubSub	Redis (опционально)
Telegram Bot	Telegram.Bot 19.x
Рейтинги	Собственная Elo система
Live связь	SignalR WebSocket
Frontend	React 19 + Vite
Шахматы	chess.js + react-chessboard
Telegram WebApp	@tma.js/sdk
Инфраструктура	Docker Compose
🚀 Быстрый старт
1. Клонирование и установка

bash
git clone <your-repo>
cd TelegramLichessBot
cp .env.example .env

2. Настройка переменных окружения

bash
# .env
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
ConnectionStrings__Default=Host=localhost;Database=chessdb;Username=postgres;Password=YourStrong@Passw0rd
REDIS_CONNECTION=localhost:6379 # опционально
FRONTEND_URL=https://your-miniapp-domain.com
BACKEND_URL=https://api.yourapp.com
JWT_SECRET=your_jwt_secret_key_min_32_chars

3. Запуск (Docker Compose)

bash
# Базовый запуск
docker-compose up -d

# С пересборкой
docker-compose up --build -d

# Логи
docker-compose logs -f chess-backend

📁 Структура проекта

text
TelegramLichBot/
├── src/
│   ├── Backend/                 # ASP.NET Core API + SignalR
│   │   ├── Controllers/
│   │   ├── Hubs/ChessHub.cs
│   │   ├── Services/
│   │   ├── Data/ChessDbContext.cs  # PostgreSQL EF Core
│   │   ├── Models/
│   │   └── ChessLichBot.csproj
│   ├── Frontend/                # React + Vite
│   │   ├── src/
│   │   │   ├── components/ChessBoard.tsx
│   │   │   ├── hooks/useChess.ts
│   │   │   └── stores/gameStore.ts
│   │   ├── vite.config.ts
│   │   └── dist/                # Статические файлы
│   └── docker-compose.yml
├── nginx.conf                   # Reverse proxy
└── README.md

🗄️ База данных (PostgreSQL)
Миграции

bash
# В контейнере backend
docker-compose exec chess-backend dotnet ef migrations add InitialCreate
docker-compose exec chess-backend dotnet ef database update

Схема таблиц

sql
Users: Id (PK), TelegramId (Unique), Username, Elo (default 1200), GamesPlayed, Wins, Losses, Draws, CreatedAt
Games: Id (UUID), WhitePlayerId, BlackPlayerId, PGN, FEN, Status (Pending/Active/Completed), Result, TimeControl, CreatedAt, CompletedAt
Moves: Id, GameId, MoveNumber, SAN, FEN, TimeSpent, CreatedAt
MatchmakingQueue: Id, UserId, EloRange, TimeControl, CreatedAt
Tournaments: Id, Name, Status, StartDate, MaxPlayers, TimeControl
TournamentParticipants: TournamentId, UserId, Score, Rank
GameInvites: Id, FromUserId, ToUserId, Status (Pending/Accepted/Declined), CreatedAt

🔌 API Endpoints (Swagger: /swagger)
Метод	Endpoint	Описание
POST	/bot/webhook	Telegram Bot webhook
GET	/api/users/me	Текущий пользователь
GET	/api/users/{id}	Профиль игрока
POST	/api/games	Создать игру
GET	/api/games/{gameId}	Получить игру
POST	/api/games/{gameId}/move	Сделать ход
POST	/api/matchmaking/join	Войти в очередь
DELETE	/api/matchmaking/leave	Выйти из очереди
GET	/api/to, m."MoveNumber", m."SAN", m."TimeSpentMs"
FROM (
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id" AS "Id0", u."CreatedAt" AS "CreatedAt0", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id" AS "Id1", u0."CreatedAt" AS "CreatedAt1", u0."Draws" AS "Draws0", u0."Elo" AS "Elo0", u0."Email" AS "Email0", u0."GamesPlayed" AS "GamesPlayed0", u0."IsAnonymous" AS "IsAnonymous0", u0."LastActiveAt" AS "LastActiveAt0", u0."Losses" AS "Losses0", u0."PasswordHash" AS "PasswordHash0", u0."TelegramId" AS "TelegramId0", u0."Username" AS "Username0", u0."Wins" AS "Wins0"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Id" = @id
LIMIT 1
) AS s
LEFT JOIN "Moves" AS m ON s."Id" = m."GameId"
ORDER BY s."Id", s."Id0", s."Id1", m."MoveNumber"
info: ChessBackend.Hubs.ChessHub[0]
Client connected: aiAOKbxiYd7j4s1KSSJq3w
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id", u0."CreatedAt", u0."Draws", u0."Elo", u0."Email", u0."GamesPlayed", u0."IsAnonymous", u0."LastActiveAt", u0."Losses", u0."PasswordHash", u0."TelegramId", u0."Username", u0."Wins"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Status" = 1
info: ChessBackend.Hubs.ChessHub[0]
Connection aiAOKbxiYd7j4s1KSSJq3w joined game 5310029e-1a7a-4841-bb0c-30b3855527c2
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (2ms) [Parameters=[@p='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
SELECT u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins"
FROM "Users" AS u
WHERE u."Id" = @p
LIMIT 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@userId='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId"
FROM "Games" AS g
WHERE (g."WhitePlayerId" = @userId OR g."BlackPlayerId" = @userId) AND g."Status" IN (0, 1)
ORDER BY g."CreatedAt" DESC
LIMIT 1
info: ChessBackend.Services.MatchmakingService[0]
User 91 already has active game 5310029e-1a7a-4841-bb0c-30b3855527c2
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (2ms) [Parameters=[@id='?' (DbType = Guid)], CommandType='Text', CommandTimeout='30']
SELECT s."Id", s."BlackPlayerConnected", s."BlackPlayerId", s."BlackPlayerLastSeen", s."CompletedAt", s."CreatedAt", s."FEN", s."PGN", s."Result", s."StartedAt", s."Status", s."TimeControl", s."WhitePlayerConnected", s."WhitePlayerId", s."WhitePlayerLastSeen", s."WinnerId", s."Id0", s."CreatedAt0", s."Draws", s."Elo", s."Email", s."GamesPlayed", s."IsAnonymous", s."LastActiveAt", s."Losses", s."PasswordHash", s."TelegramId", s."Username", s."Wins", s."Id1", s."CreatedAt1", s."Draws0", s."Elo0", s."Email0", s."GamesPlayed0", s."IsAnonymous0", s."LastActiveAt0", s."Losses0", s."PasswordHash0", s."TelegramId0", s."Username0", s."Wins0", m."Id", m."CreatedAt", m."FEN", m."GameId", m."MoveNumber", m."SAN", m."TimeSpentMs"
FROM (
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id" AS "Id0", u."CreatedAt" AS "CreatedAt0", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id" AS "Id1", u0."CreatedAt" AS "CreatedAt1", u0."Draws" AS "Draws0", u0."Elo" AS "Elo0", u0."Email" AS "Email0", u0."GamesPlayed" AS "GamesPlayed0", u0."IsAnonymous" AS "IsAnonymous0", u0."LastActiveAt" AS "LastActiveAt0", u0."Losses" AS "Losses0", u0."PasswordHash" AS "PasswordHash0", u0."TelegramId" AS "TelegramId0", u0."Username" AS "Username0", u0."Wins" AS "Wins0"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Id" = @id
LIMIT 1
) AS s
LEFT JOIN "Moves" AS m ON s."Id" = m."GameId"
ORDER BY s."Id", s."Id0", s."Id1", m."MoveNumber"
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (2ms) [Parameters=[@id='?' (DbType = Guid)], CommandType='Text', CommandTimeout='30']
SELECT s."Id", s."BlackPlayerConnected", s."BlackPlayerId", s."BlackPlayerLastSeen", s."CompletedAt", s."CreatedAt", s."FEN", s."PGN", s."Result", s."StartedAt", s."Status", s."TimeControl", s."WhitePlayerConnected", s."WhitePlayerId", s."WhitePlayerLastSeen", s."WinnerId", s."Id0", s."CreatedAt0", s."Draws", s."Elo", s."Email", s."GamesPlayed", s."IsAnonymous", s."LastActiveAt", s."Losses", s."PasswordHash", s."TelegramId", s."Username", s."Wins", s."Id1", s."CreatedAt1", s."Draws0", s."Elo0", s."Email0", s."GamesPlayed0", s."IsAnonymous0", s."LastActiveAt0", s."Losses0", s."PasswordHash0", s."TelegramId0", s."Username0", s."Wins0", m."Id", m."CreatedAt", m."FEN", m."GameId", m."MoveNumber", m."SAN", m."TimeSpentMs"
FROM (
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id" AS "Id0", u."CreatedAt" AS "CreatedAt0", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id" AS "Id1", u0."CreatedAt" AS "CreatedAt1", u0."Draws" AS "Draws0", u0."Elo" AS "Elo0", u0."Email" AS "Email0", u0."GamesPlayed" AS "GamesPlayed0", u0."IsAnonymous" AS "IsAnonymous0", u0."LastActiveAt" AS "LastActiveAt0", u0."Losses" AS "Losses0", u0."PasswordHash" AS "PasswordHash0", u0."TelegramId" AS "TelegramId0", u0."Username" AS "Username0", u0."Wins" AS "Wins0"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Id" = @id
LIMIT 1
) AS s
LEFT JOIN "Moves" AS m ON s."Id" = m."GameId"
ORDER BY s."Id", s."Id0", s."Id1", m."MoveNumber"
info: ChessBackend.Hubs.ChessHub[0]
Client connected: 1zLdiP2Nl_oaanHkzWPz9g
info: ChessBackend.Hubs.ChessHub[0]
Connection 1zLdiP2Nl_oaanHkzWPz9g joined game 5310029e-1a7a-4841-bb0c-30b3855527c2
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id", u0."CreatedAt", u0."Draws", u0."Elo", u0."Email", u0."GamesPlayed", u0."IsAnonymous", u0."LastActiveAt", u0."Losses", u0."PasswordHash", u0."TelegramId", u0."Username", u0."Wins"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Status" = 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id", u0."CreatedAt", u0."Draws", u0."Elo", u0."Email", u0."GamesPlayed", u0."IsAnonymous", u0."LastActiveAt", u0."Losses", u0."PasswordHash", u0."TelegramId", u0."Username", u0."Wins"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Status" = 1
info: ChessBackend.Hubs.ChessHub[0]
Client disconnected: 1zLdiP2Nl_oaanHkzWPz9g
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@p='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
SELECT u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins"
FROM "Users" AS u
WHERE u."Id" = @p
LIMIT 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (2ms) [Parameters=[@id='?' (DbType = Guid)], CommandType='Text', CommandTimeout='30']
SELECT s."Id", s."BlackPlayerConnected", s."BlackPlayerId", s."BlackPlayerLastSeen", s."CompletedAt", s."CreatedAt", s."FEN", s."PGN", s."Result", s."StartedAt", s."Status", s."TimeControl", s."WhitePlayerConnected", s."WhitePlayerId", s."WhitePlayerLastSeen", s."WinnerId", s."Id0", s."CreatedAt0", s."Draws", s."Elo", s."Email", s."GamesPlayed", s."IsAnonymous", s."LastActiveAt", s."Losses", s."PasswordHash", s."TelegramId", s."Username", s."Wins", s."Id1", s."CreatedAt1", s."Draws0", s."Elo0", s."Email0", s."GamesPlayed0", s."IsAnonymous0", s."LastActiveAt0", s."Losses0", s."PasswordHash0", s."TelegramId0", s."Username0", s."Wins0", m."Id", m."CreatedAt", m."FEN", m."GameId", m."MoveNumber", m."SAN", m."TimeSpentMs"
FROM (
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id" AS "Id0", u."CreatedAt" AS "CreatedAt0", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id" AS "Id1", u0."CreatedAt" AS "CreatedAt1", u0."Draws" AS "Draws0", u0."Elo" AS "Elo0", u0."Email" AS "Email0", u0."GamesPlayed" AS "GamesPlayed0", u0."IsAnonymous" AS "IsAnonymous0", u0."LastActiveAt" AS "LastActiveAt0", u0."Losses" AS "Losses0", u0."PasswordHash" AS "PasswordHash0", u0."TelegramId" AS "TelegramId0", u0."Username" AS "Username0", u0."Wins" AS "Wins0"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Id" = @id
LIMIT 1
) AS s
LEFT JOIN "Moves" AS m ON s."Id" = m."GameId"
ORDER BY s."Id", s."Id0", s."Id1", m."MoveNumber"
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@id='?' (DbType = Guid)], CommandType='Text', CommandTimeout='30']
SELECT s."Id", s."BlackPlayerConnected", s."BlackPlayerId", s."BlackPlayerLastSeen", s."CompletedAt", s."CreatedAt", s."FEN", s."PGN", s."Result", s."StartedAt", s."Status", s."TimeControl", s."WhitePlayerConnected", s."WhitePlayerId", s."WhitePlayerLastSeen", s."WinnerId", s."Id0", s."CreatedAt0", s."Draws", s."Elo", s."Email", s."GamesPlayed", s."IsAnonymous", s."LastActiveAt", s."Losses", s."PasswordHash", s."TelegramId", s."Username", s."Wins", s."Id1", s."CreatedAt1", s."Draws0", s."Elo0", s."Email0", s."GamesPlayed0", s."IsAnonymous0", s."LastActiveAt0", s."Losses0", s."PasswordHash0", s."TelegramId0", s."Username0", s."Wins0", m."Id", m."CreatedAt", m."FEN", m."GameId", m."MoveNumber", m."SAN", m."TimeSpentMs"
FROM (
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id" AS "Id0", u."CreatedAt" AS "CreatedAt0", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id" AS "Id1", u0."CreatedAt" AS "CreatedAt1", u0."Draws" AS "Draws0", u0."Elo" AS "Elo0", u0."Email" AS "Email0", u0."GamesPlayed" AS "GamesPlayed0", u0."IsAnonymous" AS "IsAnonymous0", u0."LastActiveAt" AS "LastActiveAt0", u0."Losses" AS "Losses0", u0."PasswordHash" AS "PasswordHash0", u0."TelegramId" AS "TelegramId0", u0."Username" AS "Username0", u0."Wins" AS "Wins0"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Id" = @id
LIMIT 1
) AS s
LEFT JOIN "Moves" AS m ON s."Id" = m."GameId"
ORDER BY s."Id", s."Id0", s."Id1", m."MoveNumber"
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@p='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
SELECT u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins"
FROM "Users" AS u
WHERE u."Id" = @p
LIMIT 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id", u0."CreatedAt", u0."Draws", u0."Elo", u0."Email", u0."GamesPlayed", u0."IsAnonymous", u0."LastActiveAt", u0."Losses", u0."PasswordHash", u0."TelegramId", u0."Username", u0."Wins"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Status" = 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@p='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
SELECT u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins"
FROM "Users" AS u
WHERE u."Id" = @p
LIMIT 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@id='?' (DbType = Guid)], CommandType='Text', CommandTimeout='30']
SELECT s."Id", s."BlackPlayerConnected", s."BlackPlayerId", s."BlackPlayerLastSeen", s."CompletedAt", s."CreatedAt", s."FEN", s."PGN", s."Result", s."StartedAt", s."Status", s."TimeControl", s."WhitePlayerConnected", s."WhitePlayerId", s."WhitePlayerLastSeen", s."WinnerId", s."Id0", s."CreatedAt0", s."Draws", s."Elo", s."Email", s."GamesPlayed", s."IsAnonymous", s."LastActiveAt", s."Losses", s."PasswordHash", s."TelegramId", s."Username", s."Wins", s."Id1", s."CreatedAt1", s."Draws0", s."Elo0", s."Email0", s."GamesPlayed0", s."IsAnonymous0", s."LastActiveAt0", s."Losses0", s."PasswordHash0", s."TelegramId0", s."Username0", s."Wins0", m."Id", m."CreatedAt", m."FEN", m."GameId", m."MoveNumber", m."SAN", m."TimeSpentMs"
FROM (
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id" AS "Id0", u."CreatedAt" AS "CreatedAt0", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id" AS "Id1", u0."CreatedAt" AS "CreatedAt1", u0."Draws" AS "Draws0", u0."Elo" AS "Elo0", u0."Email" AS "Email0", u0."GamesPlayed" AS "GamesPlayed0", u0."IsAnonymous" AS "IsAnonymous0", u0."LastActiveAt" AS "LastActiveAt0", u0."Losses" AS "Losses0", u0."PasswordHash" AS "PasswordHash0", u0."TelegramId" AS "TelegramId0", u0."Username" AS "Username0", u0."Wins" AS "Wins0"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Id" = @id
LIMIT 1
) AS s
LEFT JOIN "Moves" AS m ON s."Id" = m."GameId"
ORDER BY s."Id", s."Id0", s."Id1", m."MoveNumber"
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (2ms) [Parameters=[@id='?' (DbType = Guid)], CommandType='Text', CommandTimeout='30']
SELECT s."Id", s."BlackPlayerConnected", s."BlackPlayerId", s."BlackPlayerLastSeen", s."CompletedAt", s."CreatedAt", s."FEN", s."PGN", s."Result", s."StartedAt", s."Status", s."TimeControl", s."WhitePlayerConnected", s."WhitePlayerId", s."WhitePlayerLastSeen", s."WinnerId", s."Id0", s."CreatedAt0", s."Draws", s."Elo", s."Email", s."GamesPlayed", s."IsAnonymous", s."LastActiveAt", s."Losses", s."PasswordHash", s."TelegramId", s."Username", s."Wins", s."Id1", s."CreatedAt1", s."Draws0", s."Elo0", s."Email0", s."GamesPlayed0", s."IsAnonymous0", s."LastActiveAt0", s."Losses0", s."PasswordHash0", s."TelegramId0", s."Username0", s."Wins0", m."Id", m."CreatedAt", m."FEN", m."GameId", m."MoveNumber", m."SAN", m."TimeSpentMs"
FROM (
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id" AS "Id0", u."CreatedAt" AS "CreatedAt0", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id" AS "Id1", u0."CreatedAt" AS "CreatedAt1", u0."Draws" AS "Draws0", u0."Elo" AS "Elo0", u0."Email" AS "Email0", u0."GamesPlayed" AS "GamesPlayed0", u0."IsAnonymous" AS "IsAnonymous0", u0."LastActiveAt" AS "LastActiveAt0", u0."Losses" AS "Losses0", u0."PasswordHash" AS "PasswordHash0", u0."TelegramId" AS "TelegramId0", u0."Username" AS "Username0", u0."Wins" AS "Wins0"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Id" = @id
LIMIT 1
) AS s
LEFT JOIN "Moves" AS m ON s."Id" = m."GameId"
ORDER BY s."Id", s."Id0", s."Id1", m."MoveNumber"
info: ChessBackend.Hubs.ChessHub[0]
Client connected: tbu1YCMeM1UdcwSgBreLTw
info: ChessBackend.Hubs.ChessHub[0]
Connection tbu1YCMeM1UdcwSgBreLTw joined game 5310029e-1a7a-4841-bb0c-30b3855527c2
info: ChessBackend.Hubs.ChessHub[0]
Connection tbu1YCMeM1UdcwSgBreLTw left game 5310029e-1a7a-4841-bb0c-30b3855527c2
info: ChessBackend.Hubs.ChessHub[0]
Connection aiAOKbxiYd7j4s1KSSJq3w left game 5310029e-1a7a-4841-bb0c-30b3855527c2
info: ChessBackend.Hubs.ChessHub[0]
Client disconnected: aiAOKbxiYd7j4s1KSSJq3w
info: ChessBackend.Hubs.ChessHub[0]
Client disconnected: tbu1YCMeM1UdcwSgBreLTw
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (2ms) [Parameters=[@p0='?' (DbType = DateTime), @p1='?' (DbType = Int32), @p2='?' (DbType = Int32), @p3='?', @p4='?' (DbType = Int32), @p5='?' (DbType = Boolean), @p6='?' (DbType = DateTime), @p7='?' (DbType = Int32), @p8='?', @p9='?' (DbType = Int64), @p10='?', @p11='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
INSERT INTO "Users" ("CreatedAt", "Draws", "Elo", "Email", "GamesPlayed", "IsAnonymous", "LastActiveAt", "Losses", "PasswordHash", "TelegramId", "Username", "Wins")
VALUES (@p0, @p1, @p2, @p3, @p4, @p5, @p6, @p7, @p8, @p9, @p10, @p11)
RETURNING "Id";
info: ChessBackend.Controllers.AuthController[0]
Guest user created: Guest_32eb91c9
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@p='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
SELECT u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins"
FROM "Users" AS u
WHERE u."Id" = @p
LIMIT 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@id='?' (DbType = Guid)], CommandType='Text', CommandTimeout='30']
SELECT s."Id", s."BlackPlayerConnected", s."BlackPlayerId", s."BlackPlayerLastSeen", s."CompletedAt", s."CreatedAt", s."FEN", s."PGN", s."Result", s."StartedAt", s."Status", s."TimeControl", s."WhitePlayerConnected", s."WhitePlayerId", s."WhitePlayerLastSeen", s."WinnerId", s."Id0", s."CreatedAt0", s."Draws", s."Elo", s."Email", s."GamesPlayed", s."IsAnonymous", s."LastActiveAt", s."Losses", s."PasswordHash", s."TelegramId", s."Username", s."Wins", s."Id1", s."CreatedAt1", s."Draws0", s."Elo0", s."Email0", s."GamesPlayed0", s."IsAnonymous0", s."LastActiveAt0", s."Losses0", s."PasswordHash0", s."TelegramId0", s."Username0", s."Wins0", m."Id", m."CreatedAt", m."FEN", m."GameId", m."MoveNumber", m."SAN", m."TimeSpentMs"
FROM (
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id" AS "Id0", u."CreatedAt" AS "CreatedAt0", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id" AS "Id1", u0."CreatedAt" AS "CreatedAt1", u0."Draws" AS "Draws0", u0."Elo" AS "Elo0", u0."Email" AS "Email0", u0."GamesPlayed" AS "GamesPlayed0", u0."IsAnonymous" AS "IsAnonymous0", u0."LastActiveAt" AS "LastActiveAt0", u0."Losses" AS "Losses0", u0."PasswordHash" AS "PasswordHash0", u0."TelegramId" AS "TelegramId0", u0."Username" AS "Username0", u0."Wins" AS "Wins0"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Id" = @id
LIMIT 1
) AS s
LEFT JOIN "Moves" AS m ON s."Id" = m."GameId"
ORDER BY s."Id", s."Id0", s."Id1", m."MoveNumber"
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@id='?' (DbType = Guid)], CommandType='Text', CommandTimeout='30']
SELECT s."Id", s."BlackPlayerConnected", s."BlackPlayerId", s."BlackPlayerLastSeen", s."CompletedAt", s."CreatedAt", s."FEN", s."PGN", s."Result", s."StartedAt", s."Status", s."TimeControl", s."WhitePlayerConnected", s."WhitePlayerId", s."WhitePlayerLastSeen", s."WinnerId", s."Id0", s."CreatedAt0", s."Draws", s."Elo", s."Email", s."GamesPlayed", s."IsAnonymous", s."LastActiveAt", s."Losses", s."PasswordHash", s."TelegramId", s."Username", s."Wins", s."Id1", s."CreatedAt1", s."Draws0", s."Elo0", s."Email0", s."GamesPlayed0", s."IsAnonymous0", s."LastActiveAt0", s."Losses0", s."PasswordHash0", s."TelegramId0", s."Username0", s."Wins0", m."Id", m."CreatedAt", m."FEN", m."GameId", m."MoveNumber", m."SAN", m."TimeSpentMs"
FROM (
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id" AS "Id0", u."CreatedAt" AS "CreatedAt0", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id" AS "Id1", u0."CreatedAt" AS "CreatedAt1", u0."Draws" AS "Draws0", u0."Elo" AS "Elo0", u0."Email" AS "Email0", u0."GamesPlayed" AS "GamesPlayed0", u0."IsAnonymous" AS "IsAnonymous0", u0."LastActiveAt" AS "LastActiveAt0", u0."Losses" AS "Losses0", u0."PasswordHash" AS "PasswordHash0", u0."TelegramId" AS "TelegramId0", u0."Username" AS "Username0", u0."Wins" AS "Wins0"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Id" = @id
LIMIT 1
) AS s
LEFT JOIN "Moves" AS m ON s."Id" = m."GameId"
ORDER BY s."Id", s."Id0", s."Id1", m."MoveNumber"
info: ChessBackend.Hubs.ChessHub[0]
Client connected: fSk8N7L8lS3k6Y-9y6pxsg
info: ChessBackend.Hubs.ChessHub[0]
Client disconnected: fSk8N7L8lS3k6Y-9y6pxsg
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (0ms) [Parameters=[@p='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
SELECT u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins"
FROM "Users" AS u
WHERE u."Id" = @p
LIMIT 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (0ms) [Parameters=[@p='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
SELECT u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins"
FROM "Users" AS u
WHERE u."Id" = @p
LIMIT 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@userId='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId"
FROM "Games" AS g
WHERE (g."WhitePlayerId" = @userId OR g."BlackPlayerId" = @userId) AND g."Status" IN (0, 1)
ORDER BY g."CreatedAt" DESC
LIMIT 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@userId='?' (DbType = Int32), @timeControl='?', @user_Elo='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
SELECT m."Id", m."CreatedAt", m."MaxElo", m."MinElo", m."TimeControl", m."UserId", u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins"
FROM "MatchmakingQueue" AS m
INNER JOIN "Users" AS u ON m."UserId" = u."Id"
WHERE m."UserId" <> @userId AND m."TimeControl" = @timeControl AND m."MinElo" <= @user_Elo AND m."MaxElo" >= @user_Elo
ORDER BY m."CreatedAt"
LIMIT 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@userId='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
SELECT EXISTS (
SELECT 1
FROM "MatchmakingQueue" AS m
WHERE m."UserId" = @userId)
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@userId='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
SELECT m."Id", m."CreatedAt", m."MaxElo", m."MinElo", m."TimeControl", m."UserId"
FROM "MatchmakingQueue" AS m
WHERE m."UserId" = @userId
LIMIT 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (2ms) [Parameters=[@p0='?' (DbType = DateTime), @p1='?' (DbType = Int32), @p2='?' (DbType = Int32), @p3='?', @p4='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
INSERT INTO "MatchmakingQueue" ("CreatedAt", "MaxElo", "MinElo", "TimeControl", "UserId")
VALUES (@p0, @p1, @p2, @p3, @p4)
RETURNING "Id";
info: ChessBackend.Services.MatchmakingService[0]
User 93 joined matchmaking queue
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (2ms) [Parameters=[@p0='?' (DbType = DateTime), @p1='?' (DbType = Int32), @p2='?' (DbType = Int32), @p3='?', @p4='?' (DbType = Int32), @p5='?' (DbType = Boolean), @p6='?' (DbType = DateTime), @p7='?' (DbType = Int32), @p8='?', @p9='?' (DbType = Int64), @p10='?', @p11='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
INSERT INTO "Users" ("CreatedAt", "Draws", "Elo", "Email", "GamesPlayed", "IsAnonymous", "LastActiveAt", "Losses", "PasswordHash", "TelegramId", "Username", "Wins")
VALUES (@p0, @p1, @p2, @p3, @p4, @p5, @p6, @p7, @p8, @p9, @p10, @p11)
RETURNING "Id";
info: ChessBackend.Controllers.AuthController[0]
Guest user created: Guest_6a8adae6
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (0ms) [Parameters=[@p='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
SELECT u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins"
FROM "Users" AS u
WHERE u."Id" = @p
LIMIT 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (2ms) [Parameters=[@id='?' (DbType = Guid)], CommandType='Text', CommandTimeout='30']
SELECT s."Id", s."BlackPlayerConnected", s."BlackPlayerId", s."BlackPlayerLastSeen", s."CompletedAt", s."CreatedAt", s."FEN", s."PGN", s."Result", s."StartedAt", s."Status", s."TimeControl", s."WhitePlayerConnected", s."WhitePlayerId", s."WhitePlayerLastSeen", s."WinnerId", s."Id0", s."CreatedAt0", s."Draws", s."Elo", s."Email", s."GamesPlayed", s."IsAnonymous", s."LastActiveAt", s."Losses", s."PasswordHash", s."TelegramId", s."Username", s."Wins", s."Id1", s."CreatedAt1", s."Draws0", s."Elo0", s."Email0", s."GamesPlayed0", s."IsAnonymous0", s."LastActiveAt0", s."Losses0", s."PasswordHash0", s."TelegramId0", s."Username0", s."Wins0", m."Id", m."CreatedAt", m."FEN", m."GameId", m."MoveNumber", m."SAN", m."TimeSpentMs"
FROM (
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id" AS "Id0", u."CreatedAt" AS "CreatedAt0", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id" AS "Id1", u0."CreatedAt" AS "CreatedAt1", u0."Draws" AS "Draws0", u0."Elo" AS "Elo0", u0."Email" AS "Email0", u0."GamesPlayed" AS "GamesPlayed0", u0."IsAnonymous" AS "IsAnonymous0", u0."LastActiveAt" AS "LastActiveAt0", u0."Losses" AS "Losses0", u0."PasswordHash" AS "PasswordHash0", u0."TelegramId" AS "TelegramId0", u0."Username" AS "Username0", u0."Wins" AS "Wins0"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Id" = @id
LIMIT 1
) AS s
LEFT JOIN "Moves" AS m ON s."Id" = m."GameId"
ORDER BY s."Id", s."Id0", s."Id1", m."MoveNumber"
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (2ms) [Parameters=[@id='?' (DbType = Guid)], CommandType='Text', CommandTimeout='30']
SELECT s."Id", s."BlackPlayerConnected", s."BlackPlayerId", s."BlackPlayerLastSeen", s."CompletedAt", s."CreatedAt", s."FEN", s."PGN", s."Result", s."StartedAt", s."Status", s."TimeControl", s."WhitePlayerConnected", s."WhitePlayerId", s."WhitePlayerLastSeen", s."WinnerId", s."Id0", s."CreatedAt0", s."Draws", s."Elo", s."Email", s."GamesPlayed", s."IsAnonymous", s."LastActiveAt", s."Losses", s."PasswordHash", s."TelegramId", s."Username", s."Wins", s."Id1", s."CreatedAt1", s."Draws0", s."Elo0", s."Email0", s."GamesPlayed0", s."IsAnonymous0", s."LastActiveAt0", s."Losses0", s."PasswordHash0", s."TelegramId0", s."Username0", s."Wins0", m."Id", m."CreatedAt", m."FEN", m."GameId", m."MoveNumber", m."SAN", m."TimeSpentMs"
FROM (
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id" AS "Id0", u."CreatedAt" AS "CreatedAt0", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id" AS "Id1", u0."CreatedAt" AS "CreatedAt1", u0."Draws" AS "Draws0", u0."Elo" AS "Elo0", u0."Email" AS "Email0", u0."GamesPlayed" AS "GamesPlayed0", u0."IsAnonymous" AS "IsAnonymous0", u0."LastActiveAt" AS "LastActiveAt0", u0."Losses" AS "Losses0", u0."PasswordHash" AS "PasswordHash0", u0."TelegramId" AS "TelegramId0", u0."Username" AS "Username0", u0."Wins" AS "Wins0"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Id" = @id
LIMIT 1
) AS s
LEFT JOIN "Moves" AS m ON s."Id" = m."GameId"
ORDER BY s."Id", s."Id0", s."Id1", m."MoveNumber"
info: ChessBackend.Hubs.ChessHub[0]
Client connected: xB8l7dm-i0DZ6xtdIdIhZg
info: ChessBackend.Hubs.ChessHub[0]
Client disconnected: xB8l7dm-i0DZ6xtdIdIhZg
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@p='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
SELECT u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins"
FROM "Users" AS u
WHERE u."Id" = @p
LIMIT 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@p='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
SELECT u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins"
FROM "Users" AS u
WHERE u."Id" = @p
LIMIT 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (0ms) [Parameters=[@userId='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId"
FROM "Games" AS g
WHERE (g."WhitePlayerId" = @userId OR g."BlackPlayerId" = @userId) AND g."Status" IN (0, 1)
ORDER BY g."CreatedAt" DESC
LIMIT 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@userId='?' (DbType = Int32), @timeControl='?', @user_Elo='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
SELECT m."Id", m."CreatedAt", m."MaxElo", m."MinElo", m."TimeControl", m."UserId", u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins"
FROM "MatchmakingQueue" AS m
INNER JOIN "Users" AS u ON m."UserId" = u."Id"
WHERE m."UserId" <> @userId AND m."TimeControl" = @timeControl AND m."MinElo" <= @user_Elo AND m."MaxElo" >= @user_Elo
ORDER BY m."CreatedAt"
LIMIT 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (0ms) [Parameters=[@userId='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
SELECT m."Id", m."CreatedAt", m."MaxElo", m."MinElo", m."TimeControl", m."UserId"
FROM "MatchmakingQueue" AS m
WHERE m."UserId" = @userId
LIMIT 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@p0='?' (DbType = Guid), @p1='?' (DbType = Boolean), @p2='?' (DbType = Int32), @p3='?' (DbType = DateTime), @p4='?' (DbType = DateTime), @p5='?' (DbType = DateTime), @p6='?', @p7='?', @p8='?' (DbType = Int32), @p9='?' (DbType = DateTime), @p10='?' (DbType = Int32), @p11='?', @p12='?' (DbType = Boolean), @p13='?' (DbType = Int32), @p14='?' (DbType = DateTime), @p15='?' (DbType = Int32), @p16='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
INSERT INTO "Games" ("Id", "BlackPlayerConnected", "BlackPlayerId", "BlackPlayerLastSeen", "CompletedAt", "CreatedAt", "FEN", "PGN", "Result", "StartedAt", "Status", "TimeControl", "WhitePlayerConnected", "WhitePlayerId", "WhitePlayerLastSeen", "WinnerId")
VALUES (@p0, @p1, @p2, @p3, @p4, @p5, @p6, @p7, @p8, @p9, @p10, @p11, @p12, @p13, @p14, @p15);
DELETE FROM "MatchmakingQueue"
WHERE "Id" = @p16;
info: ChessBackend.Services.MatchmakingService[0]
Match created: 6490aa20-8866-48d1-952a-14bdb0dac571 between 94 (user) and 93 (opponent)
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@id='?' (DbType = Guid)], CommandType='Text', CommandTimeout='30']
SELECT s."Id", s."BlackPlayerConnected", s."BlackPlayerId", s."BlackPlayerLastSeen", s."CompletedAt", s."CreatedAt", s."FEN", s."PGN", s."Result", s."StartedAt", s."Status", s."TimeControl", s."WhitePlayerConnected", s."WhitePlayerId", s."WhitePlayerLastSeen", s."WinnerId", s."Id0", s."CreatedAt0", s."Draws", s."Elo", s."Email", s."GamesPlayed", s."IsAnonymous", s."LastActiveAt", s."Losses", s."PasswordHash", s."TelegramId", s."Username", s."Wins", s."Id1", s."CreatedAt1", s."Draws0", s."Elo0", s."Email0", s."GamesPlayed0", s."IsAnonymous0", s."LastActiveAt0", s."Losses0", s."PasswordHash0", s."TelegramId0", s."Username0", s."Wins0", m."Id", m."CreatedAt", m."FEN", m."GameId", m."MoveNumber", m."SAN", m."TimeSpentMs"
FROM (
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id" AS "Id0", u."CreatedAt" AS "CreatedAt0", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id" AS "Id1", u0."CreatedAt" AS "CreatedAt1", u0."Draws" AS "Draws0", u0."Elo" AS "Elo0", u0."Email" AS "Email0", u0."GamesPlayed" AS "GamesPlayed0", u0."IsAnonymous" AS "IsAnonymous0", u0."LastActiveAt" AS "LastActiveAt0", u0."Losses" AS "Losses0", u0."PasswordHash" AS "PasswordHash0", u0."TelegramId" AS "TelegramId0", u0."Username" AS "Username0", u0."Wins" AS "Wins0"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Id" = @id
LIMIT 1
) AS s
LEFT JOIN "Moves" AS m ON s."Id" = m."GameId"
ORDER BY s."Id", s."Id0", s."Id1", m."MoveNumber"
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@id='?' (DbType = Guid)], CommandType='Text', CommandTimeout='30']
SELECT s."Id", s."BlackPlayerConnected", s."BlackPlayerId", s."BlackPlayerLastSeen", s."CompletedAt", s."CreatedAt", s."FEN", s."PGN", s."Result", s."StartedAt", s."Status", s."TimeControl", s."WhitePlayerConnected", s."WhitePlayerId", s."WhitePlayerLastSeen", s."WinnerId", s."Id0", s."CreatedAt0", s."Draws", s."Elo", s."Email", s."GamesPlayed", s."IsAnonymous", s."LastActiveAt", s."Losses", s."PasswordHash", s."TelegramId", s."Username", s."Wins", s."Id1", s."CreatedAt1", s."Draws0", s."Elo0", s."Email0", s."GamesPlayed0", s."IsAnonymous0", s."LastActiveAt0", s."Losses0", s."PasswordHash0", s."TelegramId0", s."Username0", s."Wins0", m."Id", m."CreatedAt", m."FEN", m."GameId", m."MoveNumber", m."SAN", m."TimeSpentMs"
FROM (
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id" AS "Id0", u."CreatedAt" AS "CreatedAt0", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id" AS "Id1", u0."CreatedAt" AS "CreatedAt1", u0."Draws" AS "Draws0", u0."Elo" AS "Elo0", u0."Email" AS "Email0", u0."GamesPlayed" AS "GamesPlayed0", u0."IsAnonymous" AS "IsAnonymous0", u0."LastActiveAt" AS "LastActiveAt0", u0."Losses" AS "Losses0", u0."PasswordHash" AS "PasswordHash0", u0."TelegramId" AS "TelegramId0", u0."Username" AS "Username0", u0."Wins" AS "Wins0"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Id" = @id
LIMIT 1
) AS s
LEFT JOIN "Moves" AS m ON s."Id" = m."GameId"
ORDER BY s."Id", s."Id0", s."Id1", m."MoveNumber"
info: ChessBackend.Hubs.ChessHub[0]
Client connected: GS2pX1zMlMjcRVLul5Ad-w
info: ChessBackend.Hubs.ChessHub[0]
Connection GS2pX1zMlMjcRVLul5Ad-w joined game 6490aa20-8866-48d1-952a-14bdb0dac571
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@p='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
SELECT u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins"
FROM "Users" AS u
WHERE u."Id" = @p
LIMIT 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@userId='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId"
FROM "Games" AS g
WHERE (g."WhitePlayerId" = @userId OR g."BlackPlayerId" = @userId) AND g."Status" IN (0, 1)
ORDER BY g."CreatedAt" DESC
LIMIT 1
info: ChessBackend.Services.MatchmakingService[0]
User 93 already has active game 6490aa20-8866-48d1-952a-14bdb0dac571
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@id='?' (DbType = Guid)], CommandType='Text', CommandTimeout='30']
SELECT s."Id", s."BlackPlayerConnected", s."BlackPlayerId", s."BlackPlayerLastSeen", s."CompletedAt", s."CreatedAt", s."FEN", s."PGN", s."Result", s."StartedAt", s."Status", s."TimeControl", s."WhitePlayerConnected", s."WhitePlayerId", s."WhitePlayerLastSeen", s."WinnerId", s."Id0", s."CreatedAt0", s."Draws", s."Elo", s."Email", s."GamesPlayed", s."IsAnonymous", s."LastActiveAt", s."Losses", s."PasswordHash", s."TelegramId", s."Username", s."Wins", s."Id1", s."CreatedAt1", s."Draws0", s."Elo0", s."Email0", s."GamesPlayed0", s."IsAnonymous0", s."LastActiveAt0", s."Losses0", s."PasswordHash0", s."TelegramId0", s."Username0", s."Wins0", m."Id", m."CreatedAt", m."FEN", m."GameId", m."MoveNumber", m."SAN", m."TimeSpentMs"
FROM (
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id" AS "Id0", u."CreatedAt" AS "CreatedAt0", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id" AS "Id1", u0."CreatedAt" AS "CreatedAt1", u0."Draws" AS "Draws0", u0."Elo" AS "Elo0", u0."Email" AS "Email0", u0."GamesPlayed" AS "GamesPlayed0", u0."IsAnonymous" AS "IsAnonymous0", u0."LastActiveAt" AS "LastActiveAt0", u0."Losses" AS "Losses0", u0."PasswordHash" AS "PasswordHash0", u0."TelegramId" AS "TelegramId0", u0."Username" AS "Username0", u0."Wins" AS "Wins0"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Id" = @id
LIMIT 1
) AS s
LEFT JOIN "Moves" AS m ON s."Id" = m."GameId"
ORDER BY s."Id", s."Id0", s."Id1", m."MoveNumber"
info: ChessBackend.Hubs.ChessHub[0]
Client connected: 3gsj4NfJPCEIRz5x0szcug
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (17ms) [Parameters=[@id='?' (DbType = Guid)], CommandType='Text', CommandTimeout='30']
SELECT s."Id", s."BlackPlayerConnected", s."BlackPlayerId", s."BlackPlayerLastSeen", s."CompletedAt", s."CreatedAt", s."FEN", s."PGN", s."Result", s."StartedAt", s."Status", s."TimeControl", s."WhitePlayerConnected", s."WhitePlayerId", s."WhitePlayerLastSeen", s."WinnerId", s."Id0", s."CreatedAt0", s."Draws", s."Elo", s."Email", s."GamesPlayed", s."IsAnonymous", s."LastActiveAt", s."Losses", s."PasswordHash", s."TelegramId", s."Username", s."Wins", s."Id1", s."CreatedAt1", s."Draws0", s."Elo0", s."Email0", s."GamesPlayed0", s."IsAnonymous0", s."LastActiveAt0", s."Losses0", s."PasswordHash0", s."TelegramId0", s."Username0", s."Wins0", m."Id", m."CreatedAt", m."FEN", m."GameId", m."MoveNumber", m."SAN", m."TimeSpentMs"
FROM (
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id" AS "Id0", u."CreatedAt" AS "CreatedAt0", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id" AS "Id1", u0."CreatedAt" AS "CreatedAt1", u0."Draws" AS "Draws0", u0."Elo" AS "Elo0", u0."Email" AS "Email0", u0."GamesPlayed" AS "GamesPlayed0", u0."IsAnonymous" AS "IsAnonymous0", u0."LastActiveAt" AS "LastActiveAt0", u0."Losses" AS "Losses0", u0."PasswordHash" AS "PasswordHash0", u0."TelegramId" AS "TelegramId0", u0."Username" AS "Username0", u0."Wins" AS "Wins0"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Id" = @id
LIMIT 1
) AS s
LEFT JOIN "Moves" AS m ON s."Id" = m."GameId"
ORDER BY s."Id", s."Id0", s."Id1", m."MoveNumber"
info: ChessBackend.Hubs.ChessHub[0]
Connection 3gsj4NfJPCEIRz5x0szcug joined game 6490aa20-8866-48d1-952a-14bdb0dac571
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id", u0."CreatedAt", u0."Draws", u0."Elo", u0."Email", u0."GamesPlayed", u0."IsAnonymous", u0."LastActiveAt", u0."Losses", u0."PasswordHash", u0."TelegramId", u0."Username", u0."Wins"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Status" = 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id", u0."CreatedAt", u0."Draws", u0."Elo", u0."Email", u0."GamesPlayed", u0."IsAnonymous", u0."LastActiveAt", u0."Losses", u0."PasswordHash", u0."TelegramId", u0."Username", u0."Wins"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Status" = 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id", u0."CreatedAt", u0."Draws", u0."Elo", u0."Email", u0."GamesPlayed", u0."IsAnonymous", u0."LastActiveAt", u0."Losses", u0."PasswordHash", u0."TelegramId", u0."Username", u0."Wins"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Status" = 1
^Ainfo: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id", u0."CreatedAt", u0."Draws", u0."Elo", u0."Email", u0."GamesPlayed", u0."IsAnonymous", u0."LastActiveAt", u0."Losses", u0."PasswordHash", u0."TelegramId", u0."Username", u0."Wins"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Status" = 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id", u0."CreatedAt", u0."Draws", u0."Elo", u0."Email", u0."GamesPlayed", u0."IsAnonymous", u0."LastActiveAt", u0."Losses", u0."PasswordHash", u0."TelegramId", u0."Username", u0."Wins"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Status" = 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id", u0."CreatedAt", u0."Draws", u0."Elo", u0."Email", u0."GamesPlayed", u0."IsAnonymous", u0."LastActiveAt", u0."Losses", u0."PasswordHash", u0."TelegramId", u0."Username", u0."Wins"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Status" = 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (2ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id", u0."CreatedAt", u0."Draws", u0."Elo", u0."Email", u0."GamesPlayed", u0."IsAnonymous", u0."LastActiveAt", u0."Losses", u0."PasswordHash", u0."TelegramId", u0."Username", u0."Wins"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Status" = 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id", u0."CreatedAt", u0."Draws", u0."Elo", u0."Email", u0."GamesPlayed", u0."IsAnonymous", u0."LastActiveAt", u0."Losses", u0."PasswordHash", u0."TelegramId", u0."Username", u0."Wins"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Status" = 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id", u0."CreatedAt", u0."Draws", u0."Elo", u0."Email", u0."GamesPlayed", u0."IsAnonymous", u0."LastActiveAt", u0."Losses", u0."PasswordHash", u0."TelegramId", u0."Username", u0."Wins"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Status" = 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id", u0."CreatedAt", u0."Draws", u0."Elo", u0."Email", u0."GamesPlayed", u0."IsAnonymous", u0."LastActiveAt", u0."Losses", u0."PasswordHash", u0."TelegramId", u0."Username", u0."Wins"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Status" = 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id", u0."CreatedAt", u0."Draws", u0."Elo", u0."Email", u0."GamesPlayed", u0."IsAnonymous", u0."LastActiveAt", u0."Losses", u0."PasswordHash", u0."TelegramId", u0."Username", u0."Wins"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Status" = 1
info: ChessBackend.Hubs.ChessHub[0]
Connection GS2pX1zMlMjcRVLul5Ad-w left game 6490aa20-8866-48d1-952a-14bdb0dac571
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (6ms) [Parameters=[@id='?' (DbType = Guid)], CommandType='Text', CommandTimeout='30']
SELECT s."Id", s."BlackPlayerConnected", s."BlackPlayerId", s."BlackPlayerLastSeen", s."CompletedAt", s."CreatedAt", s."FEN", s."PGN", s."Result", s."StartedAt", s."Status", s."TimeControl", s."WhitePlayerConnected", s."WhitePlayerId", s."WhitePlayerLastSeen", s."WinnerId", s."Id0", s."CreatedAt0", s."Draws", s."Elo", s."Email", s."GamesPlayed", s."IsAnonymous", s."LastActiveAt", s."Losses", s."PasswordHash", s."TelegramId", s."Username", s."Wins", s."Id1", s."CreatedAt1", s."Draws0", s."Elo0", s."Email0", s."GamesPlayed0", s."IsAnonymous0", s."LastActiveAt0", s."Losses0", s."PasswordHash0", s."TelegramId0", s."Username0", s."Wins0", m."Id", m."CreatedAt", m."FEN", m."GameId", m."MoveNumber", m."SAN", m."TimeSpentMs"
FROM (
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id" AS "Id0", u."CreatedAt" AS "CreatedAt0", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id" AS "Id1", u0."CreatedAt" AS "CreatedAt1", u0."Draws" AS "Draws0", u0."Elo" AS "Elo0", u0."Email" AS "Email0", u0."GamesPlayed" AS "GamesPlayed0", u0."IsAnonymous" AS "IsAnonymous0", u0."LastActiveAt" AS "LastActiveAt0", u0."Losses" AS "Losses0", u0."PasswordHash" AS "PasswordHash0", u0."TelegramId" AS "TelegramId0", u0."Username" AS "Username0", u0."Wins" AS "Wins0"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Id" = @id
LIMIT 1
) AS s
LEFT JOIN "Moves" AS m ON s."Id" = m."GameId"
ORDER BY s."Id", s."Id0", s."Id1", m."MoveNumber"
info: ChessBackend.Hubs.ChessHub[0]
Connection 3gsj4NfJPCEIRz5x0szcug left game 6490aa20-8866-48d1-952a-14bdb0dac571
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (3ms) [Parameters=[@id='?' (DbType = Guid)], CommandType='Text', CommandTimeout='30']
SELECT s."Id", s."BlackPlayerConnected", s."BlackPlayerId", s."BlackPlayerLastSeen", s."CompletedAt", s."CreatedAt", s."FEN", s."PGN", s."Result", s."StartedAt", s."Status", s."TimeControl", s."WhitePlayerConnected", s."WhitePlayerId", s."WhitePlayerLastSeen", s."WinnerId", s."Id0", s."CreatedAt0", s."Draws", s."Elo", s."Email", s."GamesPlayed", s."IsAnonymous", s."LastActiveAt", s."Losses", s."PasswordHash", s."TelegramId", s."Username", s."Wins", s."Id1", s."CreatedAt1", s."Draws0", s."Elo0", s."Email0", s."GamesPlayed0", s."IsAnonymous0", s."LastActiveAt0", s."Losses0", s."PasswordHash0", s."TelegramId0", s."Username0", s."Wins0", m."Id", m."CreatedAt", m."FEN", m."GameId", m."MoveNumber", m."SAN", m."TimeSpentMs"
FROM (
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id" AS "Id0", u."CreatedAt" AS "CreatedAt0", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id" AS "Id1", u0."CreatedAt" AS "CreatedAt1", u0."Draws" AS "Draws0", u0."Elo" AS "Elo0", u0."Email" AS "Email0", u0."GamesPlayed" AS "GamesPlayed0", u0."IsAnonymous" AS "IsAnonymous0", u0."LastActiveAt" AS "LastActiveAt0", u0."Losses" AS "Losses0", u0."PasswordHash" AS "PasswordHash0", u0."TelegramId" AS "TelegramId0", u0."Username" AS "Username0", u0."Wins" AS "Wins0"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Id" = @id
LIMIT 1
) AS s
LEFT JOIN "Moves" AS m ON s."Id" = m."GameId"
ORDER BY s."Id", s."Id0", s."Id1", m."MoveNumber"
info: ChessBackend.Hubs.ChessHub[0]
Client connected: wWWVnYOiITmsQypwNcS53g
info: ChessBackend.Hubs.ChessHub[0]
Client connected: bZbiCMhce_eiBNl95p931A
info: ChessBackend.Hubs.ChessHub[0]
Connection wWWVnYOiITmsQypwNcS53g joined game 6490aa20-8866-48d1-952a-14bdb0dac571
info: ChessBackend.Hubs.ChessHub[0]
Connection bZbiCMhce_eiBNl95p931A joined game 6490aa20-8866-48d1-952a-14bdb0dac571
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id", u0."CreatedAt", u0."Draws", u0."Elo", u0."Email", u0."GamesPlayed", u0."IsAnonymous", u0."LastActiveAt", u0."Losses", u0."PasswordHash", u0."TelegramId", u0."Username", u0."Wins"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Status" = 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id", u0."CreatedAt", u0."Draws", u0."Elo", u0."Email", u0."GamesPlayed", u0."IsAnonymous", u0."LastActiveAt", u0."Losses", u0."PasswordHash", u0."TelegramId", u0."Username", u0."Wins"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Status" = 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id", u0."CreatedAt", u0."Draws", u0."Elo", u0."Email", u0."GamesPlayed", u0."IsAnonymous", u0."LastActiveAt", u0."Losses", u0."PasswordHash", u0."TelegramId", u0."Username", u0."Wins"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Status" = 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id", u0."CreatedAt", u0."Draws", u0."Elo", u0."Email", u0."GamesPlayed", u0."IsAnonymous", u0."LastActiveAt", u0."Losses", u0."PasswordHash", u0."TelegramId", u0."Username", u0."Wins"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Status" = 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id", u0."CreatedAt", u0."Draws", u0."Elo", u0."Email", u0."GamesPlayed", u0."IsAnonymous", u0."LastActiveAt", u0."Losses", u0."PasswordHash", u0."TelegramId", u0."Username", u0."Wins"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Status" = 1
info: ChessBackend.Hubs.ChessHub[0]
Client disconnected: GS2pX1zMlMjcRVLul5Ad-w
info: ChessBackend.Hubs.ChessHub[0]
Client disconnected: wWWVnYOiITmsQypwNcS53g
info: ChessBackend.Hubs.ChessHub[0]
Client disconnected: 3gsj4NfJPCEIRz5x0szcug
info: ChessBackend.Hubs.ChessHub[0]
Client disconnected: bZbiCMhce_eiBNl95p931A
info: ChessBackend.Hubs.ChessHub[0]
Client connected: 9s6ucfZKgDOWgVyXoIIAmw
info: ChessBackend.Hubs.ChessHub[0]
Client disconnected: 9s6ucfZKgDOWgVyXoIIAmw
info: ChessBackend.Hubs.ChessHub[0]
Client connected: q-MAu4WNTiB0ZYs3X9oCMg
info: ChessBackend.Hubs.ChessHub[0]
Client connected: r0nlipxd52Oqd0hy3TVB2Q
info: ChessBackend.Hubs.ChessHub[0]
Client disconnected: q-MAu4WNTiB0ZYs3X9oCMg
info: ChessBackend.Hubs.ChessHub[0]
Client disconnected: r0nlipxd52Oqd0hy3TVB2Q
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@p='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
SELECT u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins"
FROM "Users" AS u
WHERE u."Id" = @p
LIMIT 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@p='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
SELECT u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins"
FROM "Users" AS u
WHERE u."Id" = @p
LIMIT 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@id='?' (DbType = Guid)], CommandType='Text', CommandTimeout='30']
SELECT s."Id", s."BlackPlayerConnected", s."BlackPlayerId", s."BlackPlayerLastSeen", s."CompletedAt", s."CreatedAt", s."FEN", s."PGN", s."Result", s."StartedAt", s."Status", s."TimeControl", s."WhitePlayerConnected", s."WhitePlayerId", s."WhitePlayerLastSeen", s."WinnerId", s."Id0", s."CreatedAt0", s."Draws", s."Elo", s."Email", s."GamesPlayed", s."IsAnonymous", s."LastActiveAt", s."Losses", s."PasswordHash", s."TelegramId", s."Username", s."Wins", s."Id1", s."CreatedAt1", s."Draws0", s."Elo0", s."Email0", s."GamesPlayed0", s."IsAnonymous0", s."LastActiveAt0", s."Losses0", s."PasswordHash0", s."TelegramId0", s."Username0", s."Wins0", m."Id", m."CreatedAt", m."FEN", m."GameId", m."MoveNumber", m."SAN", m."TimeSpentMs"
FROM (
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id" AS "Id0", u."CreatedAt" AS "CreatedAt0", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id" AS "Id1", u0."CreatedAt" AS "CreatedAt1", u0."Draws" AS "Draws0", u0."Elo" AS "Elo0", u0."Email" AS "Email0", u0."GamesPlayed" AS "GamesPlayed0", u0."IsAnonymous" AS "IsAnonymous0", u0."LastActiveAt" AS "LastActiveAt0", u0."Losses" AS "Losses0", u0."PasswordHash" AS "PasswordHash0", u0."TelegramId" AS "TelegramId0", u0."Username" AS "Username0", u0."Wins" AS "Wins0"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Id" = @id
LIMIT 1
) AS s
LEFT JOIN "Moves" AS m ON s."Id" = m."GameId"
ORDER BY s."Id", s."Id0", s."Id1", m."MoveNumber"
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@id='?' (DbType = Guid)], CommandType='Text', CommandTimeout='30']
SELECT s."Id", s."BlackPlayerConnected", s."BlackPlayerId", s."BlackPlayerLastSeen", s."CompletedAt", s."CreatedAt", s."FEN", s."PGN", s."Result", s."StartedAt", s."Status", s."TimeControl", s."WhitePlayerConnected", s."WhitePlayerId", s."WhitePlayerLastSeen", s."WinnerId", s."Id0", s."CreatedAt0", s."Draws", s."Elo", s."Email", s."GamesPlayed", s."IsAnonymous", s."LastActiveAt", s."Losses", s."PasswordHash", s."TelegramId", s."Username", s."Wins", s."Id1", s."CreatedAt1", s."Draws0", s."Elo0", s."Email0", s."GamesPlayed0", s."IsAnonymous0", s."LastActiveAt0", s."Losses0", s."PasswordHash0", s."TelegramId0", s."Username0", s."Wins0", m."Id", m."CreatedAt", m."FEN", m."GameId", m."MoveNumber", m."SAN", m."TimeSpentMs"
FROM (
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id" AS "Id0", u."CreatedAt" AS "CreatedAt0", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id" AS "Id1", u0."CreatedAt" AS "CreatedAt1", u0."Draws" AS "Draws0", u0."Elo" AS "Elo0", u0."Email" AS "Email0", u0."GamesPlayed" AS "GamesPlayed0", u0."IsAnonymous" AS "IsAnonymous0", u0."LastActiveAt" AS "LastActiveAt0", u0."Losses" AS "Losses0", u0."PasswordHash" AS "PasswordHash0", u0."TelegramId" AS "TelegramId0", u0."Username" AS "Username0", u0."Wins" AS "Wins0"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Id" = @id
LIMIT 1
) AS s
LEFT JOIN "Moves" AS m ON s."Id" = m."GameId"
ORDER BY s."Id", s."Id0", s."Id1", m."MoveNumber"
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@id='?' (DbType = Guid)], CommandType='Text', CommandTimeout='30']
SELECT s."Id", s."BlackPlayerConnected", s."BlackPlayerId", s."BlackPlayerLastSeen", s."CompletedAt", s."CreatedAt", s."FEN", s."PGN", s."Result", s."StartedAt", s."Status", s."TimeControl", s."WhitePlayerConnected", s."WhitePlayerId", s."WhitePlayerLastSeen", s."WinnerId", s."Id0", s."CreatedAt0", s."Draws", s."Elo", s."Email", s."GamesPlayed", s."IsAnonymous", s."LastActiveAt", s."Losses", s."PasswordHash", s."TelegramId", s."Username", s."Wins", s."Id1", s."CreatedAt1", s."Draws0", s."Elo0", s."Email0", s."GamesPlayed0", s."IsAnonymous0", s."LastActiveAt0", s."Losses0", s."PasswordHash0", s."TelegramId0", s."Username0", s."Wins0", m."Id", m."CreatedAt", m."FEN", m."GameId", m."MoveNumber", m."SAN", m."TimeSpentMs"
FROM (
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id" AS "Id0", u."CreatedAt" AS "CreatedAt0", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id" AS "Id1", u0."CreatedAt" AS "CreatedAt1", u0."Draws" AS "Draws0", u0."Elo" AS "Elo0", u0."Email" AS "Email0", u0."GamesPlayed" AS "GamesPlayed0", u0."IsAnonymous" AS "IsAnonymous0", u0."LastActiveAt" AS "LastActiveAt0", u0."Losses" AS "Losses0", u0."PasswordHash" AS "PasswordHash0", u0."TelegramId" AS "TelegramId0", u0."Username" AS "Username0", u0."Wins" AS "Wins0"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Id" = @id
LIMIT 1
) AS s
LEFT JOIN "Moves" AS m ON s."Id" = m."GameId"
ORDER BY s."Id", s."Id0", s."Id1", m."MoveNumber"
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@id='?' (DbType = Guid)], CommandType='Text', CommandTimeout='30']
SELECT s."Id", s."BlackPlayerConnected", s."BlackPlayerId", s."BlackPlayerLastSeen", s."CompletedAt", s."CreatedAt", s."FEN", s."PGN", s."Result", s."StartedAt", s."Status", s."TimeControl", s."WhitePlayerConnected", s."WhitePlayerId", s."WhitePlayerLastSeen", s."WinnerId", s."Id0", s."CreatedAt0", s."Draws", s."Elo", s."Email", s."GamesPlayed", s."IsAnonymous", s."LastActiveAt", s."Losses", s."PasswordHash", s."TelegramId", s."Username", s."Wins", s."Id1", s."CreatedAt1", s."Draws0", s."Elo0", s."Email0", s."GamesPlayed0", s."IsAnonymous0", s."LastActiveAt0", s."Losses0", s."PasswordHash0", s."TelegramId0", s."Username0", s."Wins0", m."Id", m."CreatedAt", m."FEN", m."GameId", m."MoveNumber", m."SAN", m."TimeSpentMs"
FROM (
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id" AS "Id0", u."CreatedAt" AS "CreatedAt0", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id" AS "Id1", u0."CreatedAt" AS "CreatedAt1", u0."Draws" AS "Draws0", u0."Elo" AS "Elo0", u0."Email" AS "Email0", u0."GamesPlayed" AS "GamesPlayed0", u0."IsAnonymous" AS "IsAnonymous0", u0."LastActiveAt" AS "LastActiveAt0", u0."Losses" AS "Losses0", u0."PasswordHash" AS "PasswordHash0", u0."TelegramId" AS "TelegramId0", u0."Username" AS "Username0", u0."Wins" AS "Wins0"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Id" = @id
LIMIT 1
) AS s
LEFT JOIN "Moves" AS m ON s."Id" = m."GameId"
ORDER BY s."Id", s."Id0", s."Id1", m."MoveNumber"
info: ChessBackend.Hubs.ChessHub[0]
Client connected: 5mswNws5wNJgaJb8ii868g
info: ChessBackend.Hubs.ChessHub[0]
Client connected: --_jaiNkszBBRJKA5akxbQ
info: ChessBackend.Hubs.ChessHub[0]
Connection 5mswNws5wNJgaJb8ii868g joined game 6490aa20-8866-48d1-952a-14bdb0dac571
info: ChessBackend.Hubs.ChessHub[0]
Connection --_jaiNkszBBRJKA5akxbQ joined game 6490aa20-8866-48d1-952a-14bdb0dac571
info: ChessBackend.Hubs.ChessHub[0]
Connection 5mswNws5wNJgaJb8ii868g left game 6490aa20-8866-48d1-952a-14bdb0dac571
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id", u0."CreatedAt", u0."Draws", u0."Elo", u0."Email", u0."GamesPlayed", u0."IsAnonymous", u0."LastActiveAt", u0."Losses", u0."PasswordHash", u0."TelegramId", u0."Username", u0."Wins"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Status" = 1
info: ChessBackend.Hubs.ChessHub[0]
Connection --_jaiNkszBBRJKA5akxbQ left game 6490aa20-8866-48d1-952a-14bdb0dac571
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (2ms) [Parameters=[@p0='?' (DbType = DateTime), @p1='?' (DbType = Int32), @p2='?' (DbType = Int32), @p3='?', @p4='?' (DbType = Int32), @p5='?' (DbType = Boolean), @p6='?' (DbType = DateTime), @p7='?' (DbType = Int32), @p8='?', @p9='?' (DbType = Int64), @p10='?', @p11='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
INSERT INTO "Users" ("CreatedAt", "Draws", "Elo", "Email", "GamesPlayed", "IsAnonymous", "LastActiveAt", "Losses", "PasswordHash", "TelegramId", "Username", "Wins")
VALUES (@p0, @p1, @p2, @p3, @p4, @p5, @p6, @p7, @p8, @p9, @p10, @p11)
RETURNING "Id";
info: ChessBackend.Controllers.AuthController[0]
Guest user created: Guest_07e0c885
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@p='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
SELECT u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins"
FROM "Users" AS u
WHERE u."Id" = @p
LIMIT 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@id='?' (DbType = Guid)], CommandType='Text', CommandTimeout='30']
SELECT s."Id", s."BlackPlayerConnected", s."BlackPlayerId", s."BlackPlayerLastSeen", s."CompletedAt", s."CreatedAt", s."FEN", s."PGN", s."Result", s."StartedAt", s."Status", s."TimeControl", s."WhitePlayerConnected", s."WhitePlayerId", s."WhitePlayerLastSeen", s."WinnerId", s."Id0", s."CreatedAt0", s."Draws", s."Elo", s."Email", s."GamesPlayed", s."IsAnonymous", s."LastActiveAt", s."Losses", s."PasswordHash", s."TelegramId", s."Username", s."Wins", s."Id1", s."CreatedAt1", s."Draws0", s."Elo0", s."Email0", s."GamesPlayed0", s."IsAnonymous0", s."LastActiveAt0", s."Losses0", s."PasswordHash0", s."TelegramId0", s."Username0", s."Wins0", m."Id", m."CreatedAt", m."FEN", m."GameId", m."MoveNumber", m."SAN", m."TimeSpentMs"
FROM (
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id" AS "Id0", u."CreatedAt" AS "CreatedAt0", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id" AS "Id1", u0."CreatedAt" AS "CreatedAt1", u0."Draws" AS "Draws0", u0."Elo" AS "Elo0", u0."Email" AS "Email0", u0."GamesPlayed" AS "GamesPlayed0", u0."IsAnonymous" AS "IsAnonymous0", u0."LastActiveAt" AS "LastActiveAt0", u0."Losses" AS "Losses0", u0."PasswordHash" AS "PasswordHash0", u0."TelegramId" AS "TelegramId0", u0."Username" AS "Username0", u0."Wins" AS "Wins0"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Id" = @id
LIMIT 1
) AS s
LEFT JOIN "Moves" AS m ON s."Id" = m."GameId"
ORDER BY s."Id", s."Id0", s."Id1", m."MoveNumber"
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (2ms) [Parameters=[@id='?' (DbType = Guid)], CommandType='Text', CommandTimeout='30']
SELECT s."Id", s."BlackPlayerConnected", s."BlackPlayerId", s."BlackPlayerLastSeen", s."CompletedAt", s."CreatedAt", s."FEN", s."PGN", s."Result", s."StartedAt", s."Status", s."TimeControl", s."WhitePlayerConnected", s."WhitePlayerId", s."WhitePlayerLastSeen", s."WinnerId", s."Id0", s."CreatedAt0", s."Draws", s."Elo", s."Email", s."GamesPlayed", s."IsAnonymous", s."LastActiveAt", s."Losses", s."PasswordHash", s."TelegramId", s."Username", s."Wins", s."Id1", s."CreatedAt1", s."Draws0", s."Elo0", s."Email0", s."GamesPlayed0", s."IsAnonymous0", s."LastActiveAt0", s."Losses0", s."PasswordHash0", s."TelegramId0", s."Username0", s."Wins0", m."Id", m."CreatedAt", m."FEN", m."GameId", m."MoveNumber", m."SAN", m."TimeSpentMs"
FROM (
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id" AS "Id0", u."CreatedAt" AS "CreatedAt0", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id" AS "Id1", u0."CreatedAt" AS "CreatedAt1", u0."Draws" AS "Draws0", u0."Elo" AS "Elo0", u0."Email" AS "Email0", u0."GamesPlayed" AS "GamesPlayed0", u0."IsAnonymous" AS "IsAnonymous0", u0."LastActiveAt" AS "LastActiveAt0", u0."Losses" AS "Losses0", u0."PasswordHash" AS "PasswordHash0", u0."TelegramId" AS "TelegramId0", u0."Username" AS "Username0", u0."Wins" AS "Wins0"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Id" = @id
LIMIT 1
) AS s
LEFT JOIN "Moves" AS m ON s."Id" = m."GameId"
ORDER BY s."Id", s."Id0", s."Id1", m."MoveNumber"
info: ChessBackend.Hubs.ChessHub[0]
Client disconnected: 5mswNws5wNJgaJb8ii868g
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@p='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
SELECT u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins"
FROM "Users" AS u
WHERE u."Id" = @p
LIMIT 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@p='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
SELECT u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins"
FROM "Users" AS u
WHERE u."Id" = @p
LIMIT 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@userId='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId"
FROM "Games" AS g
WHERE (g."WhitePlayerId" = @userId OR g."BlackPlayerId" = @userId) AND g."Status" IN (0, 1)
ORDER BY g."CreatedAt" DESC
LIMIT 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@userId='?' (DbType = Int32), @timeControl='?', @user_Elo='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
SELECT m."Id", m."CreatedAt", m."MaxElo", m."MinElo", m."TimeControl", m."UserId", u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins"
FROM "MatchmakingQueue" AS m
INNER JOIN "Users" AS u ON m."UserId" = u."Id"
WHERE m."UserId" <> @userId AND m."TimeControl" = @timeControl AND m."MinElo" <= @user_Elo AND m."MaxElo" >= @user_Elo
ORDER BY m."CreatedAt"
LIMIT 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (0ms) [Parameters=[@userId='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
SELECT EXISTS (
SELECT 1
FROM "MatchmakingQueue" AS m
WHERE m."UserId" = @userId)
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@userId='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
SELECT m."Id", m."CreatedAt", m."MaxElo", m."MinElo", m."TimeControl", m."UserId"
FROM "MatchmakingQueue" AS m
WHERE m."UserId" = @userId
LIMIT 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (2ms) [Parameters=[@p0='?' (DbType = DateTime), @p1='?' (DbType = Int32), @p2='?' (DbType = Int32), @p3='?', @p4='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
INSERT INTO "MatchmakingQueue" ("CreatedAt", "MaxElo", "MinElo", "TimeControl", "UserId")
VALUES (@p0, @p1, @p2, @p3, @p4)
RETURNING "Id";
info: ChessBackend.Services.MatchmakingService[0]
User 95 joined matchmaking queue
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@p='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
SELECT u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins"
FROM "Users" AS u
WHERE u."Id" = @p
LIMIT 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@userId='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId"
FROM "Games" AS g
WHERE (g."WhitePlayerId" = @userId OR g."BlackPlayerId" = @userId) AND g."Status" IN (0, 1)
ORDER BY g."CreatedAt" DESC
LIMIT 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@userId='?' (DbType = Int32), @timeControl='?', @user_Elo='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
SELECT m."Id", m."CreatedAt", m."MaxElo", m."MinElo", m."TimeControl", m."UserId", u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins"
FROM "MatchmakingQueue" AS m
INNER JOIN "Users" AS u ON m."UserId" = u."Id"
WHERE m."UserId" <> @userId AND m."TimeControl" = @timeControl AND m."MinElo" <= @user_Elo AND m."MaxElo" >= @user_Elo
ORDER BY m."CreatedAt"
LIMIT 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (2ms) [Parameters=[@userId='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
SELECT EXISTS (
SELECT 1
FROM "MatchmakingQueue" AS m
WHERE m."UserId" = @userId)
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (22ms) [Parameters=[@p0='?' (DbType = DateTime), @p1='?' (DbType = Int32), @p2='?' (DbType = Int32), @p3='?', @p4='?' (DbType = Int32), @p5='?' (DbType = Boolean), @p6='?' (DbType = DateTime), @p7='?' (DbType = Int32), @p8='?', @p9='?' (DbType = Int64), @p10='?', @p11='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
INSERT INTO "Users" ("CreatedAt", "Draws", "Elo", "Email", "GamesPlayed", "IsAnonymous", "LastActiveAt", "Losses", "PasswordHash", "TelegramId", "Username", "Wins")
VALUES (@p0, @p1, @p2, @p3, @p4, @p5, @p6, @p7, @p8, @p9, @p10, @p11)
RETURNING "Id";
info: ChessBackend.Controllers.AuthController[0]
Guest user created: Guest_ef70b0c5
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@p='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
SELECT u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins"
FROM "Users" AS u
WHERE u."Id" = @p
LIMIT 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@id='?' (DbType = Guid)], CommandType='Text', CommandTimeout='30']
SELECT s."Id", s."BlackPlayerConnected", s."BlackPlayerId", s."BlackPlayerLastSeen", s."CompletedAt", s."CreatedAt", s."FEN", s."PGN", s."Result", s."StartedAt", s."Status", s."TimeControl", s."WhitePlayerConnected", s."WhitePlayerId", s."WhitePlayerLastSeen", s."WinnerId", s."Id0", s."CreatedAt0", s."Draws", s."Elo", s."Email", s."GamesPlayed", s."IsAnonymous", s."LastActiveAt", s."Losses", s."PasswordHash", s."TelegramId", s."Username", s."Wins", s."Id1", s."CreatedAt1", s."Draws0", s."Elo0", s."Email0", s."GamesPlayed0", s."IsAnonymous0", s."LastActiveAt0", s."Losses0", s."PasswordHash0", s."TelegramId0", s."Username0", s."Wins0", m."Id", m."CreatedAt", m."FEN", m."GameId", m."MoveNumber", m."SAN", m."TimeSpentMs"
FROM (
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id" AS "Id0", u."CreatedAt" AS "CreatedAt0", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id" AS "Id1", u0."CreatedAt" AS "CreatedAt1", u0."Draws" AS "Draws0", u0."Elo" AS "Elo0", u0."Email" AS "Email0", u0."GamesPlayed" AS "GamesPlayed0", u0."IsAnonymous" AS "IsAnonymous0", u0."LastActiveAt" AS "LastActiveAt0", u0."Losses" AS "Losses0", u0."PasswordHash" AS "PasswordHash0", u0."TelegramId" AS "TelegramId0", u0."Username" AS "Username0", u0."Wins" AS "Wins0"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Id" = @id
LIMIT 1
) AS s
LEFT JOIN "Moves" AS m ON s."Id" = m."GameId"
ORDER BY s."Id", s."Id0", s."Id1", m."MoveNumber"
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@id='?' (DbType = Guid)], CommandType='Text', CommandTimeout='30']
SELECT s."Id", s."BlackPlayerConnected", s."BlackPlayerId", s."BlackPlayerLastSeen", s."CompletedAt", s."CreatedAt", s."FEN", s."PGN", s."Result", s."StartedAt", s."Status", s."TimeControl", s."WhitePlayerConnected", s."WhitePlayerId", s."WhitePlayerLastSeen", s."WinnerId", s."Id0", s."CreatedAt0", s."Draws", s."Elo", s."Email", s."GamesPlayed", s."IsAnonymous", s."LastActiveAt", s."Losses", s."PasswordHash", s."TelegramId", s."Username", s."Wins", s."Id1", s."CreatedAt1", s."Draws0", s."Elo0", s."Email0", s."GamesPlayed0", s."IsAnonymous0", s."LastActiveAt0", s."Losses0", s."PasswordHash0", s."TelegramId0", s."Username0", s."Wins0", m."Id", m."CreatedAt", m."FEN", m."GameId", m."MoveNumber", m."SAN", m."TimeSpentMs"
FROM (
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id" AS "Id0", u."CreatedAt" AS "CreatedAt0", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id" AS "Id1", u0."CreatedAt" AS "CreatedAt1", u0."Draws" AS "Draws0", u0."Elo" AS "Elo0", u0."Email" AS "Email0", u0."GamesPlayed" AS "GamesPlayed0", u0."IsAnonymous" AS "IsAnonymous0", u0."LastActiveAt" AS "LastActiveAt0", u0."Losses" AS "Losses0", u0."PasswordHash" AS "PasswordHash0", u0."TelegramId" AS "TelegramId0", u0."Username" AS "Username0", u0."Wins" AS "Wins0"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Id" = @id
LIMIT 1
) AS s
LEFT JOIN "Moves" AS m ON s."Id" = m."GameId"
ORDER BY s."Id", s."Id0", s."Id1", m."MoveNumber"
info: ChessBackend.Hubs.ChessHub[0]
Client disconnected: --_jaiNkszBBRJKA5akxbQ
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@p='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
SELECT u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins"
FROM "Users" AS u
WHERE u."Id" = @p
LIMIT 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (0ms) [Parameters=[@p='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
SELECT u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins"
FROM "Users" AS u
WHERE u."Id" = @p
LIMIT 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (0ms) [Parameters=[@userId='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId"
FROM "Games" AS g
WHERE (g."WhitePlayerId" = @userId OR g."BlackPlayerId" = @userId) AND g."Status" IN (0, 1)
ORDER BY g."CreatedAt" DESC
LIMIT 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@userId='?' (DbType = Int32), @timeControl='?', @user_Elo='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
SELECT m."Id", m."CreatedAt", m."MaxElo", m."MinElo", m."TimeControl", m."UserId", u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins"
FROM "MatchmakingQueue" AS m
INNER JOIN "Users" AS u ON m."UserId" = u."Id"
WHERE m."UserId" <> @userId AND m."TimeControl" = @timeControl AND m."MinElo" <= @user_Elo AND m."MaxElo" >= @user_Elo
ORDER BY m."CreatedAt"
LIMIT 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (0ms) [Parameters=[@userId='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
SELECT m."Id", m."CreatedAt", m."MaxElo", m."MinElo", m."TimeControl", m."UserId"
FROM "MatchmakingQueue" AS m
WHERE m."UserId" = @userId
LIMIT 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@p0='?' (DbType = Guid), @p1='?' (DbType = Boolean), @p2='?' (DbType = Int32), @p3='?' (DbType = DateTime), @p4='?' (DbType = DateTime), @p5='?' (DbType = DateTime), @p6='?', @p7='?', @p8='?' (DbType = Int32), @p9='?' (DbType = DateTime), @p10='?' (DbType = Int32), @p11='?', @p12='?' (DbType = Boolean), @p13='?' (DbType = Int32), @p14='?' (DbType = DateTime), @p15='?' (DbType = Int32), @p16='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
INSERT INTO "Games" ("Id", "BlackPlayerConnected", "BlackPlayerId", "BlackPlayerLastSeen", "CompletedAt", "CreatedAt", "FEN", "PGN", "Result", "StartedAt", "Status", "TimeControl", "WhitePlayerConnected", "WhitePlayerId", "WhitePlayerLastSeen", "WinnerId")
VALUES (@p0, @p1, @p2, @p3, @p4, @p5, @p6, @p7, @p8, @p9, @p10, @p11, @p12, @p13, @p14, @p15);
DELETE FROM "MatchmakingQueue"
WHERE "Id" = @p16;
info: ChessBackend.Services.MatchmakingService[0]
Match created: fd511db2-ad67-427f-ab1b-d71c2304900e between 96 (user) and 95 (opponent)
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@id='?' (DbType = Guid)], CommandType='Text', CommandTimeout='30']
SELECT s."Id", s."BlackPlayerConnected", s."BlackPlayerId", s."BlackPlayerLastSeen", s."CompletedAt", s."CreatedAt", s."FEN", s."PGN", s."Result", s."StartedAt", s."Status", s."TimeControl", s."WhitePlayerConnected", s."WhitePlayerId", s."WhitePlayerLastSeen", s."WinnerId", s."Id0", s."CreatedAt0", s."Draws", s."Elo", s."Email", s."GamesPlayed", s."IsAnonymous", s."LastActiveAt", s."Losses", s."PasswordHash", s."TelegramId", s."Username", s."Wins", s."Id1", s."CreatedAt1", s."Draws0", s."Elo0", s."Email0", s."GamesPlayed0", s."IsAnonymous0", s."LastActiveAt0", s."Losses0", s."PasswordHash0", s."TelegramId0", s."Username0", s."Wins0", m."Id", m."CreatedAt", m."FEN", m."GameId", m."MoveNumber", m."SAN", m."TimeSpentMs"
FROM (
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id" AS "Id0", u."CreatedAt" AS "CreatedAt0", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id" AS "Id1", u0."CreatedAt" AS "CreatedAt1", u0."Draws" AS "Draws0", u0."Elo" AS "Elo0", u0."Email" AS "Email0", u0."GamesPlayed" AS "GamesPlayed0", u0."IsAnonymous" AS "IsAnonymous0", u0."LastActiveAt" AS "LastActiveAt0", u0."Losses" AS "Losses0", u0."PasswordHash" AS "PasswordHash0", u0."TelegramId" AS "TelegramId0", u0."Username" AS "Username0", u0."Wins" AS "Wins0"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Id" = @id
LIMIT 1
) AS s
LEFT JOIN "Moves" AS m ON s."Id" = m."GameId"
ORDER BY s."Id", s."Id0", s."Id1", m."MoveNumber"
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (2ms) [Parameters=[@id='?' (DbType = Guid)], CommandType='Text', CommandTimeout='30']
SELECT s."Id", s."BlackPlayerConnected", s."BlackPlayerId", s."BlackPlayerLastSeen", s."CompletedAt", s."CreatedAt", s."FEN", s."PGN", s."Result", s."StartedAt", s."Status", s."TimeControl", s."WhitePlayerConnected", s."WhitePlayerId", s."WhitePlayerLastSeen", s."WinnerId", s."Id0", s."CreatedAt0", s."Draws", s."Elo", s."Email", s."GamesPlayed", s."IsAnonymous", s."LastActiveAt", s."Losses", s."PasswordHash", s."TelegramId", s."Username", s."Wins", s."Id1", s."CreatedAt1", s."Draws0", s."Elo0", s."Email0", s."GamesPlayed0", s."IsAnonymous0", s."LastActiveAt0", s."Losses0", s."PasswordHash0", s."TelegramId0", s."Username0", s."Wins0", m."Id", m."CreatedAt", m."FEN", m."GameId", m."MoveNumber", m."SAN", m."TimeSpentMs"
FROM (
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id" AS "Id0", u."CreatedAt" AS "CreatedAt0", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id" AS "Id1", u0."CreatedAt" AS "CreatedAt1", u0."Draws" AS "Draws0", u0."Elo" AS "Elo0", u0."Email" AS "Email0", u0."GamesPlayed" AS "GamesPlayed0", u0."IsAnonymous" AS "IsAnonymous0", u0."LastActiveAt" AS "LastActiveAt0", u0."Losses" AS "Losses0", u0."PasswordHash" AS "PasswordHash0", u0."TelegramId" AS "TelegramId0", u0."Username" AS "Username0", u0."Wins" AS "Wins0"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Id" = @id
LIMIT 1
) AS s
LEFT JOIN "Moves" AS m ON s."Id" = m."GameId"
ORDER BY s."Id", s."Id0", s."Id1", m."MoveNumber"
info: ChessBackend.Hubs.ChessHub[0]
Client connected: JGbt07ADB-ycAYpqFBdXow
info: ChessBackend.Hubs.ChessHub[0]
Connection JGbt07ADB-ycAYpqFBdXow joined game fd511db2-ad67-427f-ab1b-d71c2304900e
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id", u0."CreatedAt", u0."Draws", u0."Elo", u0."Email", u0."GamesPlayed", u0."IsAnonymous", u0."LastActiveAt", u0."Losses", u0."PasswordHash", u0."TelegramId", u0."Username", u0."Wins"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Status" = 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@p='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
SELECT u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins"
FROM "Users" AS u
WHERE u."Id" = @p
LIMIT 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@userId='?' (DbType = Int32)], CommandType='Text', CommandTimeout='30']
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId"
FROM "Games" AS g
WHERE (g."WhitePlayerId" = @userId OR g."BlackPlayerId" = @userId) AND g."Status" IN (0, 1)
ORDER BY g."CreatedAt" DESC
LIMIT 1
info: ChessBackend.Services.MatchmakingService[0]
User 95 already has active game fd511db2-ad67-427f-ab1b-d71c2304900e
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[@id='?' (DbType = Guid)], CommandType='Text', CommandTimeout='30']
SELECT s."Id", s."BlackPlayerConnected", s."BlackPlayerId", s."BlackPlayerLastSeen", s."CompletedAt", s."CreatedAt", s."FEN", s."PGN", s."Result", s."StartedAt", s."Status", s."TimeControl", s."WhitePlayerConnected", s."WhitePlayerId", s."WhitePlayerLastSeen", s."WinnerId", s."Id0", s."CreatedAt0", s."Draws", s."Elo", s."Email", s."GamesPlayed", s."IsAnonymous", s."LastActiveAt", s."Losses", s."PasswordHash", s."TelegramId", s."Username", s."Wins", s."Id1", s."CreatedAt1", s."Draws0", s."Elo0", s."Email0", s."GamesPlayed0", s."IsAnonymous0", s."LastActiveAt0", s."Losses0", s."PasswordHash0", s."TelegramId0", s."Username0", s."Wins0", m."Id", m."CreatedAt", m."FEN", m."GameId", m."MoveNumber", m."SAN", m."TimeSpentMs"
FROM (
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id" AS "Id0", u."CreatedAt" AS "CreatedAt0", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id" AS "Id1", u0."CreatedAt" AS "CreatedAt1", u0."Draws" AS "Draws0", u0."Elo" AS "Elo0", u0."Email" AS "Email0", u0."GamesPlayed" AS "GamesPlayed0", u0."IsAnonymous" AS "IsAnonymous0", u0."LastActiveAt" AS "LastActiveAt0", u0."Losses" AS "Losses0", u0."PasswordHash" AS "PasswordHash0", u0."TelegramId" AS "TelegramId0", u0."Username" AS "Username0", u0."Wins" AS "Wins0"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Id" = @id
LIMIT 1
) AS s
LEFT JOIN "Moves" AS m ON s."Id" = m."GameId"
ORDER BY s."Id", s."Id0", s."Id1", m."MoveNumber"
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (2ms) [Parameters=[@id='?' (DbType = Guid)], CommandType='Text', CommandTimeout='30']
SELECT s."Id", s."BlackPlayerConnected", s."BlackPlayerId", s."BlackPlayerLastSeen", s."CompletedAt", s."CreatedAt", s."FEN", s."PGN", s."Result", s."StartedAt", s."Status", s."TimeControl", s."WhitePlayerConnected", s."WhitePlayerId", s."WhitePlayerLastSeen", s."WinnerId", s."Id0", s."CreatedAt0", s."Draws", s."Elo", s."Email", s."GamesPlayed", s."IsAnonymous", s."LastActiveAt", s."Losses", s."PasswordHash", s."TelegramId", s."Username", s."Wins", s."Id1", s."CreatedAt1", s."Draws0", s."Elo0", s."Email0", s."GamesPlayed0", s."IsAnonymous0", s."LastActiveAt0", s."Losses0", s."PasswordHash0", s."TelegramId0", s."Username0", s."Wins0", m."Id", m."CreatedAt", m."FEN", m."GameId", m."MoveNumber", m."SAN", m."TimeSpentMs"
FROM (
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id" AS "Id0", u."CreatedAt" AS "CreatedAt0", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id" AS "Id1", u0."CreatedAt" AS "CreatedAt1", u0."Draws" AS "Draws0", u0."Elo" AS "Elo0", u0."Email" AS "Email0", u0."GamesPlayed" AS "GamesPlayed0", u0."IsAnonymous" AS "IsAnonymous0", u0."LastActiveAt" AS "LastActiveAt0", u0."Losses" AS "Losses0", u0."PasswordHash" AS "PasswordHash0", u0."TelegramId" AS "TelegramId0", u0."Username" AS "Username0", u0."Wins" AS "Wins0"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Id" = @id
LIMIT 1
) AS s
LEFT JOIN "Moves" AS m ON s."Id" = m."GameId"
ORDER BY s."Id", s."Id0", s."Id1", m."MoveNumber"
info: ChessBackend.Hubs.ChessHub[0]
Client connected: 5IN6aSuILp7XtxruXfpzpw
info: ChessBackend.Hubs.ChessHub[0]
Connection 5IN6aSuILp7XtxruXfpzpw joined game fd511db2-ad67-427f-ab1b-d71c2304900e
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id", u0."CreatedAt", u0."Draws", u0."Elo", u0."Email", u0."GamesPlayed", u0."IsAnonymous", u0."LastActiveAt", u0."Losses", u0."PasswordHash", u0."TelegramId", u0."Username", u0."Wins"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Status" = 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id", u0."CreatedAt", u0."Draws", u0."Elo", u0."Email", u0."GamesPlayed", u0."IsAnonymous", u0."LastActiveAt", u0."Losses", u0."PasswordHash", u0."TelegramId", u0."Username", u0."Wins"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Status" = 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id", u0."CreatedAt", u0."Draws", u0."Elo", u0."Email", u0."GamesPlayed", u0."IsAnonymous", u0."LastActiveAt", u0."Losses", u0."PasswordHash", u0."TelegramId", u0."Username", u0."Wins"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Status" = 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id", u0."CreatedAt", u0."Draws", u0."Elo", u0."Email", u0."GamesPlayed", u0."IsAnonymous", u0."LastActiveAt", u0."Losses", u0."PasswordHash", u0."TelegramId", u0."Username", u0."Wins"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Status" = 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id", u0."CreatedAt", u0."Draws", u0."Elo", u0."Email", u0."GamesPlayed", u0."IsAnonymous", u0."LastActiveAt", u0."Losses", u0."PasswordHash", u0."TelegramId", u0."Username", u0."Wins"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Status" = 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id", u0."CreatedAt", u0."Draws", u0."Elo", u0."Email", u0."GamesPlayed", u0."IsAnonymous", u0."LastActiveAt", u0."Losses", u0."PasswordHash", u0."TelegramId", u0."Username", u0."Wins"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Status" = 1
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (1ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id", u0."CreatedAt", u0."Draws", u0."Elo", u0."Email", u0."GamesPlayed", u0."IsAnonymous", u0."LastActiveAt", u0."Losses", u0."PasswordHash", u0."TelegramId", u0."Username", u0."Wins"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Status" = 1
^Ainfo: Microsoft.EntityFrameworkCore.Database.Command[20101]
Executed DbCommand (3ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
SELECT g."Id", g."BlackPlayerConnected", g."BlackPlayerId", g."BlackPlayerLastSeen", g."CompletedAt", g."CreatedAt", g."FEN", g."PGN", g."Result", g."StartedAt", g."Status", g."TimeControl", g."WhitePlayerConnected", g."WhitePlayerId", g."WhitePlayerLastSeen", g."WinnerId", u."Id", u."CreatedAt", u."Draws", u."Elo", u."Email", u."GamesPlayed", u."IsAnonymous", u."LastActiveAt", u."Losses", u."PasswordHash", u."TelegramId", u."Username", u."Wins", u0."Id", u0."CreatedAt", u0."Draws", u0."Elo", u0."Email", u0."GamesPlayed", u0."IsAnonymous", u0."LastActiveAt", u0."Losses", u0."PasswordHash", u0."TelegramId", u0."Username", u0."Wins"
FROM "Games" AS g
INNER JOIN "Users" AS u ON g."WhitePlayerId" = u."Id"
INNER JOIN "Users" AS u0 ON g."BlackPlayerId" = u0."Id"
WHERE g."Status" = 1
urnaments	Список турниров
POST	/api/tournaments/{id}/join	Вступить в турнир
GET	/api/leaderboard	Таблица лидеров
WS	/hubs/chess	SignalR WebSocket
🎮 Frontend (Telegram Mini App)
Установка зависимостей

bash
cd src/Frontend
npm install
npm run build  # -> dist/

Основные хуки

    useTelegram() - Telegram WebApp API

    useChess() - chess.js + SignalR

    useGameStore() - Zustand store

🏗️ Архитектура

text
Telegram User ── Mini App (React) ── SignalR ── Chess Backend (C#)
                      ↓                           ↓
                Telegram WebApp API         Elo Calculator
                      ↓                           ↓
              chess.js validation       PostgreSQL + Redis
                                                  ↓
                                          Matchmaking Service

📊 Метрики производительности

text
- Mini App размер: < 200 КБ (gzip)
- WebSocket latency: < 50ms
- 1000 concurrent users: OK (Railway)
- PGN parse: < 10ms per move

🚀 Деплой варианты
1. Railway (Рекомендуется $10/мес)

bash
railway login
railway init
railway up

2. DigitalOcean App Platform

text
Docker Compose → DO App → Auto-deploy from GitHub

3. VPS + Docker

bash
# Установка
curl -fsSL https://get.docker.com | sh
docker-compose up -d

# SSL (Let's Encrypt)
docker-compose -f docker-compose.prod.yml up -d

🔍 Логи и мониторинг

bash
# Backend логи
docker-compose logs chess-backend

# Redis мониторинг  
docker-compose exec redis redis-cli monitor

# PostgreSQL
docker-compose exec postgres psql -U postgres -d chessdb

🧪 Тестирование

bash
# Backend тесты
cd src/Backend
dotnet test

# Frontend тесты
cd src/Frontend
npm run test

# E2E (Playwright)
npm run e2e

📞 Поддержка Telegram Bot

    /start - Открыть Mini App

    /games - Мои игры

    /profile - Мой профиль и рейтинг

    /play - Найти игру

    /tournaments - Список турниров

    t.me/bot?startapp=game_abc123 - Присоединиться к игре

⚠️ Важные замечания

    HTTPS обязателен для Telegram Mini Apps

    CORS настроен для *.telegram.org

    Redis опционален (для масштабирования SignalR)

    PostgreSQL indexes на TelegramId, GameId, Elo

    Elo расчет: K-factor = 32 для новичков, 24 для опытных

    Валидация ходов на backend обязательна (защита от читов)

📄 Лицензия

MIT License - используй свободно для диплома!