using ChessBackend.Data;
using ChessBackend.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ChessBackend.Hubs;

namespace ChessBackend.Services;

public class DisconnectTimeoutService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<DisconnectTimeoutService> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromSeconds(10);
    private readonly TimeSpan _disconnectTimeout = TimeSpan.FromMinutes(5);

    public DisconnectTimeoutService(
        IServiceProvider serviceProvider,
        ILogger<DisconnectTimeoutService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("DisconnectTimeoutService started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CheckDisconnectedGames();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking disconnected games");
            }

            await Task.Delay(_checkInterval, stoppingToken);
        }
    }

    private async Task CheckDisconnectedGames()
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ChessDbContext>();
        var hubContext = scope.ServiceProvider.GetRequiredService<IHubContext<ChessHub>>();

        var now = DateTime.UtcNow;
        var timeoutThreshold = now - _disconnectTimeout;

        var games = await context.Games
            .Include(g => g.WhitePlayer)
            .Include(g => g.BlackPlayer)
            .Where(g => g.Status == GameStatus.Active)
            .ToListAsync();

        foreach (var game in games)
        {
            // Check if white player disconnected and timed out
            if (!game.WhitePlayerConnected && 
                game.WhitePlayerLastSeen.HasValue && 
                game.WhitePlayerLastSeen.Value < timeoutThreshold)
            {
                await EndGameByTimeout(game, game.BlackPlayerId, context, hubContext);
                continue;
            }

            // Check if black player disconnected and timed out
            if (!game.BlackPlayerConnected && 
                game.BlackPlayerLastSeen.HasValue && 
                game.BlackPlayerLastSeen.Value < timeoutThreshold)
            {
                await EndGameByTimeout(game, game.WhitePlayerId, context, hubContext);
            }
        }
    }

    private async Task EndGameByTimeout(
        Game game, 
        int winnerId, 
        ChessDbContext context,
        IHubContext<ChessHub> hubContext)
    {
        game.Status = GameStatus.Completed;
        game.Result = GameResult.Timeout;
        game.WinnerId = winnerId;
        game.CompletedAt = DateTime.UtcNow;

        // Update player stats
        var winner = winnerId == game.WhitePlayerId ? game.WhitePlayer : game.BlackPlayer;
        var loser = winnerId == game.WhitePlayerId ? game.BlackPlayer : game.WhitePlayer;

        winner.GamesPlayed++;
        winner.Wins++;
        loser.GamesPlayed++;
        loser.Losses++;

        await context.SaveChangesAsync();

        // Notify players
        await hubContext.Clients.Group(game.Id.ToString()).SendAsync("GameEnded", new
        {
            result = "timeout",
            winnerId,
            message = "Opponent disconnected for too long"
        });

        _logger.LogInformation($"Game {game.Id} ended by timeout. Winner: {winnerId}");
    }
}
