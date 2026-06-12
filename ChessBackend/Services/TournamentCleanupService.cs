using ChessBackend.Data;
using ChessBackend.Models;
using Microsoft.EntityFrameworkCore;

namespace ChessBackend.Services;

/// <summary>
/// Background service that automatically cleans up completed tournaments after a specified period.
/// </summary>
public class TournamentCleanupService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<TournamentCleanupService> _logger;
    private readonly IConfiguration _configuration;
    private readonly TimeSpan _checkInterval;
    private readonly TimeSpan _cleanupDelay;
    private readonly bool _enabled;

    public TournamentCleanupService(
        IServiceProvider serviceProvider,
        ILogger<TournamentCleanupService> logger,
        IConfiguration configuration)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _configuration = configuration;

        // Read configuration with defaults
        _enabled = _configuration.GetValue("TournamentCleanup:Enabled", true);
        var checkIntervalHours = _configuration.GetValue("TournamentCleanup:CheckIntervalHours", 1);
        var cleanupDelayDays = _configuration.GetValue("TournamentCleanup:CleanupDelayDays", 1);

        _checkInterval = TimeSpan.FromHours(checkIntervalHours);
        _cleanupDelay = TimeSpan.FromDays(cleanupDelayDays);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_enabled)
        {
            _logger.LogInformation("TournamentCleanupService is disabled in configuration");
            return;
        }

        _logger.LogInformation("TournamentCleanupService started - will check every {Interval} and delete tournaments {Delay} after completion", 
            _checkInterval, _cleanupDelay);

        // Wait 1 minute before first check to let the app fully start
        await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CleanupOldTournaments();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cleaning up old tournaments");
            }

            //await Task.Delay(_checkInterval, stoppingToken);
	    await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
        }
    }

    private async Task CleanupOldTournaments()
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ChessDbContext>();

        var now = DateTime.UtcNow;
        var cleanupThreshold = now - _cleanupDelay;

        // Find completed or cancelled tournaments older than the threshold
        var oldTournaments = await context.Tournaments
            .Include(t => t.Participants)
            .Include(t => t.Matches)
            .Where(t => 
                (t.Status == TournamentStatus.Completed || t.Status == TournamentStatus.Cancelled) &&
                t.CompletedAt.HasValue &&
                t.CompletedAt.Value < cleanupThreshold)
            .ToListAsync();

        if (oldTournaments.Count == 0)
        {
            _logger.LogDebug("No old tournaments to clean up");
            return;
        }

        _logger.LogInformation("Found {Count} old tournaments to clean up", oldTournaments.Count);

        foreach (var tournament in oldTournaments)
        {
            try
            {
                // Remove related data first (due to foreign key constraints)
                context.TournamentMatches.RemoveRange(tournament.Matches);
                context.TournamentParticipants.RemoveRange(tournament.Participants);
                context.Tournaments.Remove(tournament);

                await context.SaveChangesAsync();

                _logger.LogInformation(
                    "Deleted tournament '{Name}' (ID: {Id}, Room: {Room}) completed on {CompletedAt}", 
                    tournament.Name, 
                    tournament.Id, 
                    tournament.RoomName,
                    tournament.CompletedAt);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete tournament {Id}", tournament.Id);
            }
        }
    }
}
