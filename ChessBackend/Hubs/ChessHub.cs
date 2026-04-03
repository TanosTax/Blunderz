using Microsoft.AspNetCore.SignalR;
using ChessBackend.Data;
using ChessBackend.Models;
using Microsoft.EntityFrameworkCore;

namespace ChessBackend.Hubs;

public class ChessHub : Hub
{
    private readonly ChessDbContext _context;
    private readonly ILogger<ChessHub> _logger;
    private static readonly Dictionary<string, (string gameId, int playerId)> _connectionMap = new();

    public ChessHub(ChessDbContext context, ILogger<ChessHub> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task JoinGame(string gameId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, gameId);
        _logger.LogInformation($"Connection {Context.ConnectionId} joined game {gameId}");
    }

    public async Task LeaveGame(string gameId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, gameId);
        _logger.LogInformation($"Connection {Context.ConnectionId} left game {gameId}");
    }
    
    public async Task ResignGame(string gameId, int playerId)
    {
        if (!Guid.TryParse(gameId, out var gameGuid))
        {
            await Clients.Caller.SendAsync("Error", "Invalid game ID");
            return;
        }

        var game = await _context.Games
            .Include(g => g.WhitePlayer)
            .Include(g => g.BlackPlayer)
            .FirstOrDefaultAsync(g => g.Id == gameGuid);

        if (game == null)
        {
            await Clients.Caller.SendAsync("Error", "Game not found");
            return;
        }

        if (game.Status != GameStatus.Active)
        {
            await Clients.Caller.SendAsync("Error", "Game is not active");
            return;
        }

        // Determine winner (opponent of resigning player)
        int winnerId;
        
        if (game.WhitePlayerId == playerId)
        {
            winnerId = game.BlackPlayerId;
        }
        else
        {
            winnerId = game.WhitePlayerId;
        }

        game.Status = GameStatus.Completed;
        game.Result = GameResult.Resignation;
        game.WinnerId = winnerId;
        game.CompletedAt = DateTime.UtcNow;

        // Update player stats
        var winner = winnerId == game.WhitePlayerId ? game.WhitePlayer : game.BlackPlayer;
        var loser = winnerId == game.WhitePlayerId ? game.BlackPlayer : game.WhitePlayer;

        winner.GamesPlayed++;
        winner.Wins++;
        loser.GamesPlayed++;
        loser.Losses++;

        await _context.SaveChangesAsync();

        // Notify both players
        await Clients.Group(gameId).SendAsync("GameEnded", new
        {
            result = "resignation",
            winnerId,
            resignedPlayerId = playerId
        });

        _logger.LogInformation($"Player {playerId} resigned game {gameId}");
    }

    public async Task MakeMove(string gameId, string san, int whiteTimeLeft, int blackTimeLeft)
    {
        try
        {
            _logger.LogInformation($"MakeMove called: gameId={gameId}, san={san}, whiteTime={whiteTimeLeft}, blackTime={blackTimeLeft}");
            
            if (string.IsNullOrEmpty(gameId))
            {
                _logger.LogWarning("Game ID is null or empty");
                await Clients.Caller.SendAsync("Error", "Game ID is required");
                return;
            }

            if (string.IsNullOrEmpty(san))
            {
                _logger.LogWarning("SAN is null or empty");
                await Clients.Caller.SendAsync("Error", "Move notation is required");
                return;
            }
            
            if (!Guid.TryParse(gameId, out var gameGuid))
            {
                _logger.LogWarning($"Invalid game ID format: {gameId}");
                await Clients.Caller.SendAsync("Error", "Invalid game ID");
                return;
            }

            _logger.LogInformation($"Fetching game from database: {gameGuid}");
            var game = await _context.Games
                .Include(g => g.Moves)
                .FirstOrDefaultAsync(g => g.Id == gameGuid);

            if (game == null)
            {
                _logger.LogWarning($"Game not found: {gameId}");
                await Clients.Caller.SendAsync("Error", "Game not found");
                return;
            }

            _logger.LogInformation($"Game found: {gameId}, Status: {game.Status}, Moves count: {game.Moves.Count}");

            if (game.Status != GameStatus.Active)
            {
                _logger.LogWarning($"Game is not active: {gameId}, status={game.Status}");
                await Clients.Caller.SendAsync("Error", $"Game is not active (status: {game.Status})");
                return;
            }

            var moveNumber = game.Moves.Count + 1;
            _logger.LogInformation($"Creating move #{moveNumber}");
            
            // Update time in database
            game.WhiteTimeLeft = whiteTimeLeft;
            game.BlackTimeLeft = blackTimeLeft;
            
            var move = new Move
            {
                GameId = gameGuid,
                MoveNumber = moveNumber,
                SAN = san,
                FEN = "",
                CreatedAt = DateTime.UtcNow
            };

            _context.Moves.Add(move);
            
            _logger.LogInformation("Saving to database...");
            await _context.SaveChangesAsync();
            _logger.LogInformation("Saved successfully");

            // Broadcast move with time to all players
            await Clients.Group(gameId).SendAsync("MoveMade", new
            {
                moveNumber,
                san,
                whiteTimeLeft,
                blackTimeLeft,
                timestamp = move.CreatedAt
            });

            _logger.LogInformation($"Move {san} made in game {gameId}, time: W={whiteTimeLeft}s B={blackTimeLeft}s");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error in MakeMove: gameId={gameId}, san={san}, Message: {ex.Message}, StackTrace: {ex.StackTrace}");
            await Clients.Caller.SendAsync("Error", $"Failed to make move: {ex.Message}");
            throw;
        }
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation($"Client connected: {Context.ConnectionId}");
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation($"Client disconnected: {Context.ConnectionId}");
        
        // Handle disconnect
        if (_connectionMap.TryGetValue(Context.ConnectionId, out var info))
        {
            var (gameId, playerId) = info;
            
            if (Guid.TryParse(gameId, out var gameGuid))
            {
                var game = await _context.Games.FindAsync(gameGuid);
                if (game != null && game.Status == GameStatus.Active)
                {
                    var now = DateTime.UtcNow;
                    
                    if (game.WhitePlayerId == playerId)
                    {
                        game.WhitePlayerConnected = false;
                        game.WhitePlayerLastSeen = now;
                    }
                    else if (game.BlackPlayerId == playerId)
                    {
                        game.BlackPlayerConnected = false;
                        game.BlackPlayerLastSeen = now;
                    }
                    
                    await _context.SaveChangesAsync();
                    
                    // Notify opponent about disconnect
                    await Clients.Group(gameId).SendAsync("PlayerDisconnected", new { playerId, timestamp = now });
                }
            }
            
            _connectionMap.Remove(Context.ConnectionId);
        }
        
        await base.OnDisconnectedAsync(exception);
    }
}
