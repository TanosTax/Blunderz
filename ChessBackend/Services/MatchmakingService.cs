using ChessBackend.Data;
using ChessBackend.Interfaces;
using ChessBackend.Models;
using Microsoft.EntityFrameworkCore;

namespace ChessBackend.Services;

public class MatchmakingService : IMatchmakingService
{
    private readonly ChessDbContext _context;
    private readonly ILogger<MatchmakingService> _logger;

    public MatchmakingService(ChessDbContext context, ILogger<MatchmakingService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Game?> FindMatchAsync(int userId, string timeControl, int eloRange = 200)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            _logger.LogWarning($"User {userId} not found");
            return null;
        }

        // Проверяем, нет ли уже активной игры для этого пользователя
        var existingGame = await _context.Games
            .Where(g => (g.WhitePlayerId == userId || g.BlackPlayerId == userId) 
                     && (g.Status == GameStatus.Pending || g.Status == GameStatus.Active))
            .OrderByDescending(g => g.CreatedAt)
            .FirstOrDefaultAsync();

        if (existingGame != null)
        {
            _logger.LogInformation($"User {userId} already has active game {existingGame.Id}");
            return existingGame;
        }

        var minElo = user.Elo - eloRange;
        var maxElo = user.Elo + eloRange;

        // Ищем подходящего оппонента в очереди (НЕ включая текущего пользователя)
        var opponent = await _context.MatchmakingQueue
            .Include(mq => mq.User)
            .Where(mq => mq.UserId != userId &&
                         mq.TimeControl == timeControl &&
                         mq.MinElo <= user.Elo &&
                         mq.MaxElo >= user.Elo)
            .OrderBy(mq => mq.CreatedAt)
            .FirstOrDefaultAsync();

        if (opponent == null)
        {
            // Никого не нашли - добавляем в очередь и ждем
            var alreadyInQueue = await _context.MatchmakingQueue
                .AnyAsync(mq => mq.UserId == userId);
            
            if (!alreadyInQueue)
            {
                await JoinQueueAsync(userId, timeControl, eloRange);
            }
            
            return null;
        }

        // Нашли оппонента - создаем игру
        var random = new Random();
        var isWhite = random.Next(2) == 0;

        // Parse time control (format: "10+0" means 10 minutes + 0 increment)
        var timeInSeconds = 600; // default 10 minutes
        if (!string.IsNullOrEmpty(timeControl))
        {
            var parts = timeControl.Split('+');
            if (parts.Length > 0 && int.TryParse(parts[0], out var minutes))
            {
                timeInSeconds = minutes * 60;
            }
        }

        var game = new Game
        {
            WhitePlayerId = isWhite ? userId : opponent.UserId,
            BlackPlayerId = isWhite ? opponent.UserId : userId,
            TimeControl = timeControl,
            Status = GameStatus.Active,
            WhiteTimeLeft = timeInSeconds,
            BlackTimeLeft = timeInSeconds,
            CreatedAt = DateTime.UtcNow
        };

        _context.Games.Add(game);
        
        // Удаляем ОБОИХ игроков из очереди
        _context.MatchmakingQueue.Remove(opponent);
        
        var currentUserQueue = await _context.MatchmakingQueue
            .FirstOrDefaultAsync(mq => mq.UserId == userId);
        if (currentUserQueue != null)
        {
            _context.MatchmakingQueue.Remove(currentUserQueue);
        }
        
        await _context.SaveChangesAsync();

        _logger.LogInformation($"Match created: {game.Id} between {userId} (user) and {opponent.UserId} (opponent)");

        return game;
    }

    public async Task<bool> JoinQueueAsync(int userId, string timeControl, int eloRange = 200)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return false;
        }

        // Проверяем, не в очереди ли уже
        var existing = await _context.MatchmakingQueue
            .FirstOrDefaultAsync(mq => mq.UserId == userId);

        if (existing != null)
        {
            _logger.LogInformation($"User {userId} already in queue");
            return true;
        }

        var queueEntry = new MatchmakingQueue
        {
            UserId = userId,
            MinElo = user.Elo - eloRange,
            MaxElo = user.Elo + eloRange,
            TimeControl = timeControl,
            CreatedAt = DateTime.UtcNow
        };

        _context.MatchmakingQueue.Add(queueEntry);
        await _context.SaveChangesAsync();

        _logger.LogInformation($"User {userId} joined matchmaking queue");
        return true;
    }

    public async Task<bool> LeaveQueueAsync(int userId)
    {
        var queueEntry = await _context.MatchmakingQueue
            .FirstOrDefaultAsync(mq => mq.UserId == userId);

        if (queueEntry == null)
        {
            return false;
        }

        _context.MatchmakingQueue.Remove(queueEntry);
        await _context.SaveChangesAsync();

        _logger.LogInformation($"User {userId} left matchmaking queue");
        return true;
    }
}
