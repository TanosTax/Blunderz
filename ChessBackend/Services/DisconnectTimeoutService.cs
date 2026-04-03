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
    private readonly TimeSpan _checkInterval = TimeSpan.FromSeconds(5);
    private readonly TimeSpan _heartbeatTimeout = TimeSpan.FromSeconds(15);
    private readonly TimeSpan _disconnectTimeout = TimeSpan.FromMinutes(2);

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
        var heartbeatThreshold = now - _heartbeatTimeout;
        var timeoutThreshold = now - _disconnectTimeout;

        var games = await context.Games
            .Include(g => g.WhitePlayer)
            .Include(g => g.BlackPlayer)
            .Where(g => g.Status == GameStatus.Active)
            .ToListAsync();

        foreach (var game in games)
        {
            // Check white player heartbeat
            if (game.WhitePlayerLastSeen.HasValue)
            {
                if (game.WhitePlayerLastSeen.Value < heartbeatThreshold && game.WhitePlayerConnected)
                {
                    // Mark as disconnected
                    game.WhitePlayerConnected = false;
                    await context.SaveChangesAsync();
                    await hubContext.Clients.Group(game.Id.ToString()).SendAsync("PlayerDisconnected", new { playerId = game.WhitePlayerId });
                    _logger.LogInformation($"White player {game.WhitePlayerId} marked as disconnected in game {game.Id}");
                }
                
                if (game.WhitePlayerLastSeen.Value < timeoutThreshold && !game.WhitePlayerConnected)
                {
                    // 2 minutes timeout - allow claim victory
                    await hubContext.Clients.Group(game.Id.ToString()).SendAsync("OpponentDisconnectedTimeout", new 
                    { 
                        disconnectedPlayerId = game.WhitePlayerId 
                    });
                }
            }

            // Check black player heartbeat
            if (game.BlackPlayerLastSeen.HasValue)
            {
                if (game.BlackPlayerLastSeen.Value < heartbeatThreshold && game.BlackPlayerConnected)
                {
                    // Mark as disconnected
                    game.BlackPlayerConnected = false;
                    await context.SaveChangesAsync();
                    await hubContext.Clients.Group(game.Id.ToString()).SendAsync("PlayerDisconnected", new { playerId = game.BlackPlayerId });
                    _logger.LogInformation($"Black player {game.BlackPlayerId} marked as disconnected in game {game.Id}");
                }
                
                if (game.BlackPlayerLastSeen.Value < timeoutThreshold && !game.BlackPlayerConnected)
                {
                    // 2 minutes timeout - allow claim victory
                    await hubContext.Clients.Group(game.Id.ToString()).SendAsync("OpponentDisconnectedTimeout", new 
                    { 
                        disconnectedPlayerId = game.BlackPlayerId 
                    });
                }
            }
        }
    }

    private async Task EndGameByTimeout(
        Game game, 
        int winnerId, 
        ChessDbContext context,
        IHubContext<ChessHub> hubContext)
    {
        // This method is no longer used - timeout is handled by OpponentDisconnectedTimeout event
        _logger.LogInformation($"EndGameByTimeout called for game {game.Id}");
    }
}
