using ChessBackend.Data;
using ChessBackend.Interfaces;
using ChessBackend.Models;
using Microsoft.EntityFrameworkCore;

namespace ChessBackend.Services;

public class GameService : IGameService
{
    private readonly ChessDbContext _context;
    private readonly IEloCalculatorService _eloCalculator;
    private readonly ILogger<GameService> _logger;

    public GameService(
        ChessDbContext context,
        IEloCalculatorService eloCalculator,
        ILogger<GameService> logger)
    {
        _context = context;
        _eloCalculator = eloCalculator;
        _logger = logger;
    }

    public async Task<Game?> CreateGameAsync(int whitePlayerId, int blackPlayerId, string timeControl)
    {
        var whitePlayer = await _context.Users.FindAsync(whitePlayerId);
        var blackPlayer = await _context.Users.FindAsync(blackPlayerId);

        if (whitePlayer == null || blackPlayer == null)
        {
            _logger.LogWarning($"Invalid player IDs: {whitePlayerId}, {blackPlayerId}");
            return null;
        }

        var game = new Game
        {
            WhitePlayerId = whitePlayerId,
            BlackPlayerId = blackPlayerId,
            TimeControl = timeControl,
            Status = GameStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _context.Games.Add(game);
        await _context.SaveChangesAsync();

        _logger.LogInformation($"Game created: {game.Id}");
        return game;
    }

    public async Task<bool> MakeMoveAsync(Guid gameId, string san, string fen)
    {
        var game = await _context.Games
            .Include(g => g.Moves)
            .FirstOrDefaultAsync(g => g.Id == gameId);

        if (game == null || game.Status != GameStatus.Active)
        {
            return false;
        }

        var moveNumber = game.Moves.Count + 1;
        var move = new Move
        {
            GameId = gameId,
            MoveNumber = moveNumber,
            SAN = san,
            FEN = fen,
            CreatedAt = DateTime.UtcNow
        };

        game.FEN = fen;
        _context.Moves.Add(move);
        await _context.SaveChangesAsync();

        _logger.LogInformation($"Move {san} made in game {gameId}");
        return true;
    }

    public async Task<bool> EndGameAsync(Guid gameId, Models.GameResult result, int? winnerId = null)
    {
        var game = await _context.Games
            .Include(g => g.WhitePlayer)
            .Include(g => g.BlackPlayer)
            .FirstOrDefaultAsync(g => g.Id == gameId);

        if (game == null || game.Status == GameStatus.Completed)
        {
            return false;
        }

        game.Status = GameStatus.Completed;
        game.Result = result;
        game.CompletedAt = DateTime.UtcNow;
        game.WinnerId = winnerId;

        // Обновляем статистику игроков
        var whitePlayer = game.WhitePlayer;
        var blackPlayer = game.BlackPlayer;

        whitePlayer.GamesPlayed++;
        blackPlayer.GamesPlayed++;

        switch (result)
        {
            case Models.GameResult.WhiteWin:
                whitePlayer.Wins++;
                blackPlayer.Losses++;
                break;
            case Models.GameResult.BlackWin:
                blackPlayer.Wins++;
                whitePlayer.Losses++;
                break;
            case Models.GameResult.Draw:
            case Models.GameResult.Stalemate:
                whitePlayer.Draws++;
                blackPlayer.Draws++;
                break;
        }

        // Обновляем Elo рейтинги
        var eloResult = result switch
        {
            Models.GameResult.WhiteWin => Interfaces.GameResult.WhiteWin,
            Models.GameResult.BlackWin => Interfaces.GameResult.BlackWin,
            _ => Interfaces.GameResult.Draw
        };

        var (newWhiteElo, newBlackElo) = _eloCalculator.CalculateNewRatings(
            whitePlayer.Elo, blackPlayer.Elo, eloResult);

        whitePlayer.Elo = newWhiteElo;
        blackPlayer.Elo = newBlackElo;

        await _context.SaveChangesAsync();

        _logger.LogInformation($"Game {gameId} ended with result {result}");
        return true;
    }

    public async Task<bool> ValidateMoveAsync(Guid gameId, int userId, string san)
    {
        var game = await _context.Games
            .Include(g => g.Moves)
            .FirstOrDefaultAsync(g => g.Id == gameId);

        if (game == null || game.Status != GameStatus.Active)
        {
            return false;
        }

        // Проверяем очередность хода
        var isWhiteTurn = game.Moves.Count % 2 == 0;
        var isPlayerWhite = game.WhitePlayerId == userId;

        if (isWhiteTurn != isPlayerWhite)
        {
            _logger.LogWarning($"Wrong turn for user {userId} in game {gameId}");
            return false;
        }

        // Здесь можно добавить валидацию через chess.js или другую библиотеку
        // Пока просто возвращаем true
        return true;
    }
}
