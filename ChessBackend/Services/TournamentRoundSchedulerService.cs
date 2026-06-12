using ChessBackend.Data;
using ChessBackend.Models;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace ChessBackend.Services;

public class TournamentRoundSchedulerService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<TournamentRoundSchedulerService> _logger;

    public TournamentRoundSchedulerService(IServiceProvider serviceProvider, ILogger<TournamentRoundSchedulerService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Simple polling scheduler
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await using var scope = _serviceProvider.CreateAsyncScope();
                var context = scope.ServiceProvider.GetRequiredService<ChessDbContext>();
                var tournamentService = scope.ServiceProvider.GetRequiredService<TournamentService>();

                var now = DateTime.UtcNow;
                var due = await context.Tournaments
                    .Where(t => t.Status == TournamentStatus.InProgress && t.RoundReadyAt != null && t.RoundReadyAt <= now)
                    .OrderBy(t => t.RoundReadyAt)
                    .Take(20)
                    .ToListAsync(stoppingToken);

                foreach (var t in due)
                {
                    // Prevent duplicate generation
                    var nextRound = t.CurrentRound + 1;
                    _logger.LogInformation("Generating next round {Round} for tournament {TournamentId}", nextRound, t.Id);

                    t.RoundReadyAt = null;
                    t.CurrentRound = nextRound;
                    await context.SaveChangesAsync(stoppingToken);

                    await tournamentService.GenerateRoundAsync(t.Id, nextRound);
                }
            }
            catch (PostgresException ex) when (ex.SqlState == "42P01")
            {
                // Table doesn't exist yet (migrations not applied). Avoid log spam.
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Tournament scheduler error");
            }

            //await Task.Delay(TimeSpan.FromSeconds(2), stoppingToken);
	    await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
        }
    }
}

