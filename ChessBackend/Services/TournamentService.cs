using System.Security.Cryptography;
using System.Text;
using ChessBackend.Data;
using ChessBackend.Interfaces;
using ChessBackend.Models;
using Microsoft.EntityFrameworkCore;

namespace ChessBackend.Services;

public class TournamentService
{
    private readonly ChessDbContext _context;
    private readonly IGameService _gameService;
    private readonly ILogger<TournamentService> _logger;

    public TournamentService(ChessDbContext context, IGameService gameService, ILogger<TournamentService> logger)
    {
        _context = context;
        _gameService = gameService;
        _logger = logger;
    }

    public static string NormalizeRoomName(string roomName)
    {
        roomName = (roomName ?? string.Empty).Trim().ToLowerInvariant();
        roomName = roomName.Replace(' ', '-');
        return roomName;
    }

    public static bool IsValidRoomName(string roomName)
    {
        if (string.IsNullOrWhiteSpace(roomName)) return false;
        if (roomName.Length < 3 || roomName.Length > 64) return false;

        foreach (var ch in roomName)
        {
            var ok = (ch >= 'a' && ch <= 'z') ||
                     (ch >= '0' && ch <= '9') ||
                     ch == '-' || ch == '_';
            if (!ok) return false;
        }

        return true;
    }

    private static string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(hashedBytes);
    }

    public async Task<Tournament?> GetByIdAsync(Guid tournamentId)
    {
        return await _context.Tournaments
            .Include(t => t.Participants).ThenInclude(p => p.User)
            .Include(t => t.Matches)
            .FirstOrDefaultAsync(t => t.Id == tournamentId);
    }

    public async Task<Tournament?> GetByRoomAsync(string roomName)
    {
        var normalized = NormalizeRoomName(roomName);
        return await _context.Tournaments
            .Include(t => t.Participants).ThenInclude(p => p.User)
            .Include(t => t.Matches)
            .FirstOrDefaultAsync(t => t.RoomName == normalized);
    }

    public async Task<(bool ok, string? error, Tournament? tournament)> CreateAsync(
        int creatorUserId,
        string roomName,
        string name,
        string timeControl,
        int bestOf,
        int breakMinutesBetweenRounds,
        bool isPrivate,
        string? password)
    {
        var normalized = NormalizeRoomName(roomName);
        if (!IsValidRoomName(normalized))
        {
            return (false, "Invalid room name (use a-z, 0-9, '-' or '_' and length 3..64)", null);
        }

        if (string.IsNullOrWhiteSpace(name) || name.Length > 200)
        {
            return (false, "Invalid tournament name", null);
        }

        if (bestOf is not (1 or 3))
        {
            return (false, "bestOf must be 1 or 3", null);
        }

        if (breakMinutesBetweenRounds < 0 || breakMinutesBetweenRounds > 120)
        {
            return (false, "breakMinutesBetweenRounds must be 0..120", null);
        }

        var creatorExists = await _context.Users.AnyAsync(u => u.Id == creatorUserId);
        if (!creatorExists)
        {
            return (false, "Creator user not found", null);
        }

        var exists = await _context.Tournaments.AnyAsync(t => t.RoomName == normalized);
        if (exists)
        {
            return (false, "Room name already taken", null);
        }

        if (isPrivate)
        {
            if (string.IsNullOrWhiteSpace(password) || password.Length < 3 || password.Length > 64)
            {
                return (false, "Password must be 3..64 characters", null);
            }
        }

        var t = new Tournament
        {
            CreatorUserId = creatorUserId,
            RoomName = normalized,
            Name = name.Trim(),
            TimeControl = string.IsNullOrWhiteSpace(timeControl) ? "5+0" : timeControl.Trim(),
            BestOf = bestOf,
            BreakMinutesBetweenRounds = breakMinutesBetweenRounds,
            Status = TournamentStatus.Registration,
            IsPrivate = isPrivate,
            PasswordHash = isPrivate ? HashPassword(password!) : null,
            CreatedAt = DateTime.UtcNow
        };

        _context.Tournaments.Add(t);
        await _context.SaveChangesAsync();

        return (true, null, t);
    }

    public async Task<(bool ok, string? error)> JoinAsync(Guid tournamentId, int userId, string? password)
    {
        var t = await _context.Tournaments.FirstOrDefaultAsync(x => x.Id == tournamentId);
        if (t == null) return (false, "Tournament not found");
        if (t.Status != TournamentStatus.Registration && t.Status != TournamentStatus.Draft)
            return (false, "Tournament already started");

        var userExists = await _context.Users.AnyAsync(u => u.Id == userId);
        if (!userExists) return (false, "User not found");

        if (t.IsPrivate)
        {
            if (string.IsNullOrWhiteSpace(password)) return (false, "Password required");
            if (t.PasswordHash != HashPassword(password)) return (false, "Invalid password");
        }

        var already = await _context.TournamentParticipants.AnyAsync(p => p.TournamentId == tournamentId && p.UserId == userId);
        if (already) return (true, null);

        // Default seed = appended order (max+1)
        var maxSeed = await _context.TournamentParticipants
            .Where(p => p.TournamentId == tournamentId)
            .Select(p => (int?)p.Seed)
            .MaxAsync();

        var seed = (maxSeed ?? 0) + 1;

        _context.TournamentParticipants.Add(new TournamentParticipant
        {
            TournamentId = tournamentId,
            UserId = userId,
            Seed = seed,
            Status = TournamentParticipantStatus.Active,
            JoinedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return (true, null);
    }

    public async Task<(bool ok, string? error)> LeaveAsync(Guid tournamentId, int userId)
    {
        var t = await _context.Tournaments.FirstOrDefaultAsync(x => x.Id == tournamentId);
        if (t == null) return (false, "Tournament not found");
        if (t.Status != TournamentStatus.Registration && t.Status != TournamentStatus.Draft)
            return (false, "Tournament already started");

        var p = await _context.TournamentParticipants
            .FirstOrDefaultAsync(x => x.TournamentId == tournamentId && x.UserId == userId);
        if (p == null) return (true, null);

        _context.TournamentParticipants.Remove(p);
        await _context.SaveChangesAsync();
        return (true, null);
    }

    public async Task<(bool ok, string? error)> UpdateSeedsAsync(Guid tournamentId, int creatorUserId, IReadOnlyList<SeedUpdate> seeds)
    {
        var t = await _context.Tournaments.FirstOrDefaultAsync(x => x.Id == tournamentId);
        if (t == null) return (false, "Tournament not found");
        if (t.CreatorUserId != creatorUserId) return (false, "Only creator can update seeds");
        if (t.Status != TournamentStatus.Registration && t.Status != TournamentStatus.Draft)
            return (false, "Cannot update seeds after start");

        if (seeds.Count == 0) return (true, null);

        var participants = await _context.TournamentParticipants
            .Where(p => p.TournamentId == tournamentId)
            .ToListAsync();

        var map = seeds.ToDictionary(s => s.UserId, s => s.Seed);
        foreach (var p in participants)
        {
            if (map.TryGetValue(p.UserId, out var newSeed))
            {
                p.Seed = newSeed;
            }
        }

        await _context.SaveChangesAsync();
        return (true, null);
    }

    public async Task<(bool ok, string? error)> StartAsync(Guid tournamentId, int creatorUserId)
    {
        var t = await _context.Tournaments.FirstOrDefaultAsync(x => x.Id == tournamentId);
        if (t == null) return (false, "Tournament not found");
        if (t.CreatorUserId != creatorUserId) return (false, "Only creator can start");
        if (t.Status == TournamentStatus.InProgress) return (false, "Already started");
        if (t.Status == TournamentStatus.Completed) return (false, "Already completed");

        var participants = await _context.TournamentParticipants
            .Where(p => p.TournamentId == tournamentId)
            .OrderBy(p => p.Seed)
            .ToListAsync();

        if (participants.Count < 2) return (false, "Need at least 2 participants");

        t.Status = TournamentStatus.InProgress;
        t.StartedAt = DateTime.UtcNow;
        t.CurrentRound = 1;
        t.RoundReadyAt = null;
        await _context.SaveChangesAsync();

        await GenerateRoundAsync(tournamentId, roundNumber: 1);
        return (true, null);
    }

    private static int NextPowerOfTwo(int n)
    {
        var p = 1;
        while (p < n) p <<= 1;
        return p;
    }

    public async Task GenerateRoundAsync(Guid tournamentId, int roundNumber)
    {
        // Reload tournament settings
        var t = await _context.Tournaments.FirstAsync(x => x.Id == tournamentId);

        List<int?> slots;
        if (roundNumber == 1)
        {
            var participants = await _context.TournamentParticipants
                .Where(p => p.TournamentId == tournamentId && p.Status == TournamentParticipantStatus.Active)
                .OrderBy(p => p.Seed)
                .Select(p => p.UserId)
                .ToListAsync();

            var bracketSize = NextPowerOfTwo(participants.Count);
            slots = participants.Select(x => (int?)x).ToList();
            while (slots.Count < bracketSize) slots.Add(null);
        }
        else
        {
            // Winners of previous round (order by slot)
            var winners = await _context.TournamentMatches
                .Where(m => m.TournamentId == tournamentId && m.RoundNumber == roundNumber - 1)
                .OrderBy(m => m.SlotIndex)
                .Select(m => (int?)m.WinnerId)
                .ToListAsync();

            slots = winners;
        }

        var matchCount = slots.Count / 2;
        for (var i = 0; i < matchCount; i++)
        {
            var a = slots[i * 2];
            var b = slots[i * 2 + 1];

            var m = new TournamentMatch
            {
                TournamentId = tournamentId,
                RoundNumber = roundNumber,
                SlotIndex = i,
                PlayerAId = a,
                PlayerBId = b,
                BestOf = t.BestOf,
                Status = TournamentMatchStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            if (a == null && b == null)
            {
                // Shouldn't happen, skip
                continue;
            }

            if (a == null || b == null)
            {
                var winner = a ?? b;
                m.WinnerId = winner;
                m.Status = TournamentMatchStatus.Bye;
                m.CompletedAt = DateTime.UtcNow;
                _context.TournamentMatches.Add(m);
                continue;
            }

            _context.TournamentMatches.Add(m);
        }

        await _context.SaveChangesAsync();

        // Start games for non-bye matches
        var roundMatches = await _context.TournamentMatches
            .Where(m => m.TournamentId == tournamentId && m.RoundNumber == roundNumber && m.Status == TournamentMatchStatus.Pending)
            .ToListAsync();

        foreach (var m in roundMatches)
        {
            await StartNextGameForMatchAsync(m.Id);
        }

        await _context.SaveChangesAsync();

        await TryFinishTournamentIfNeededAsync(tournamentId);
        await MaybeScheduleNextRoundAsync(tournamentId, roundNumber);
    }

    private async Task StartNextGameForMatchAsync(Guid matchId)
    {
        var m = await _context.TournamentMatches.FirstAsync(x => x.Id == matchId);
        var t = await _context.Tournaments.FirstAsync(x => x.Id == m.TournamentId);

        if (m.PlayerAId == null || m.PlayerBId == null) return;
        if (m.Status == TournamentMatchStatus.Completed || m.Status == TournamentMatchStatus.Bye) return;

        // Alternate colors for bo3; first game random, then swap
        bool swapColors = (m.AWins + m.BWins) % 2 == 1;
        int whiteId, blackId;

        if (!swapColors)
        {
            // Randomize first game a bit
            if (Random.Shared.Next(2) == 0)
            {
                whiteId = m.PlayerAId.Value;
                blackId = m.PlayerBId.Value;
            }
            else
            {
                whiteId = m.PlayerBId.Value;
                blackId = m.PlayerAId.Value;
            }
        }
        else
        {
            // Swap previous assignment by swapping A/B baseline
            whiteId = m.PlayerAId.Value;
            blackId = m.PlayerBId.Value;
        }

        var game = await _gameService.CreateGameAsync(whiteId, blackId, t.TimeControl, isRanked: false);
        if (game == null)
        {
            _logger.LogError("Failed to create tournament game for match {MatchId}", matchId);
            return;
        }

        // Start game immediately
        game.Status = GameStatus.Active;
        game.StartedAt = DateTime.UtcNow;

        m.GameId = game.Id;
        m.Status = TournamentMatchStatus.InProgress;
        m.StartedAt ??= DateTime.UtcNow;

        await _context.SaveChangesAsync();
    }

    public async Task OnGameEndedAsync(Guid gameId, int? winnerId)
    {
        var match = await _context.TournamentMatches
            .FirstOrDefaultAsync(m => m.GameId == gameId && m.Status == TournamentMatchStatus.InProgress);

        if (match == null) return;

        if (match.PlayerAId == null || match.PlayerBId == null)
        {
            _logger.LogWarning("Tournament match {MatchId} has null players for game {GameId}", match.Id, gameId);
            return;
        }

        // Draws are treated as replay (create new game)
        if (winnerId == null)
        {
            await StartNextGameForMatchAsync(match.Id);
            return;
        }

        if (winnerId == match.PlayerAId) match.AWins++;
        else if (winnerId == match.PlayerBId) match.BWins++;
        else
        {
            _logger.LogWarning("WinnerId {WinnerId} not part of match {MatchId}", winnerId, match.Id);
            return;
        }

        var needed = (match.BestOf / 2) + 1;
        if (match.AWins >= needed || match.BWins >= needed)
        {
            match.WinnerId = match.AWins > match.BWins ? match.PlayerAId : match.PlayerBId;
            match.Status = TournamentMatchStatus.Completed;
            match.CompletedAt = DateTime.UtcNow;

            // Mark loser eliminated
            var loserId = match.WinnerId == match.PlayerAId ? match.PlayerBId!.Value : match.PlayerAId!.Value;
            var loser = await _context.TournamentParticipants
                .FirstOrDefaultAsync(p => p.TournamentId == match.TournamentId && p.UserId == loserId);
            if (loser != null)
            {
                loser.Status = TournamentParticipantStatus.Eliminated;
            }

            await _context.SaveChangesAsync();

            // If round complete, schedule next
            await MaybeScheduleNextRoundAsync(match.TournamentId, match.RoundNumber);
            await TryFinishTournamentIfNeededAsync(match.TournamentId);
        }
        else
        {
            await _context.SaveChangesAsync();
            await StartNextGameForMatchAsync(match.Id);
        }
    }

    private async Task MaybeScheduleNextRoundAsync(Guid tournamentId, int roundNumber)
    {
        var t = await _context.Tournaments.FirstAsync(x => x.Id == tournamentId);
        if (t.Status != TournamentStatus.InProgress) return;

        var allDone = await _context.TournamentMatches
            .Where(m => m.TournamentId == tournamentId && m.RoundNumber == roundNumber)
            .AllAsync(m => m.Status == TournamentMatchStatus.Completed || m.Status == TournamentMatchStatus.Bye);

        if (!allDone) return;

        // If there will be next round (more than 1 active participant), schedule
        var remaining = await _context.TournamentParticipants
            .Where(p => p.TournamentId == tournamentId && p.Status == TournamentParticipantStatus.Active)
            .CountAsync();

        if (remaining <= 1) return;

        t.RoundReadyAt = DateTime.UtcNow.AddMinutes(t.BreakMinutesBetweenRounds);
        t.CurrentRound = roundNumber;
        await _context.SaveChangesAsync();
    }

    private async Task TryFinishTournamentIfNeededAsync(Guid tournamentId)
    {
        var t = await _context.Tournaments.FirstAsync(x => x.Id == tournamentId);
        if (t.Status != TournamentStatus.InProgress) return;

        var remaining = await _context.TournamentParticipants
            .Where(p => p.TournamentId == tournamentId && p.Status == TournamentParticipantStatus.Active)
            .Select(p => p.UserId)
            .ToListAsync();

        if (remaining.Count == 1)
        {
            t.Status = TournamentStatus.Completed;
            t.CompletedAt = DateTime.UtcNow;
            t.RoundReadyAt = null;
            await _context.SaveChangesAsync();
        }
    }

    public async Task<List<Tournament>> GetActiveTournamentsAsync()
    {
        return await _context.Tournaments
            .Include(t => t.Participants).ThenInclude(p => p.User)
            .Include(t => t.Matches)
            .Where(t => t.Status == TournamentStatus.Registration || t.Status == TournamentStatus.InProgress)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<Tournament>> GetCompletedTournamentsAsync(int limit = 50)
    {
        return await _context.Tournaments
            .Include(t => t.Participants).ThenInclude(p => p.User)
            .Include(t => t.Matches)
            .Where(t => t.Status == TournamentStatus.Completed)
            .OrderByDescending(t => t.CompletedAt)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<List<Game>> GetTournamentGamesAsync(Guid tournamentId)
    {
        var tournament = await _context.Tournaments
            .Include(t => t.Matches)
            .FirstOrDefaultAsync(t => t.Id == tournamentId);

        if (tournament == null) return new List<Game>();

        var gameIds = tournament.Matches
            .Where(m => m.GameId.HasValue)
            .Select(m => m.GameId!.Value)
            .ToList();

        return await _context.Games
            .Include(g => g.WhitePlayer)
            .Include(g => g.BlackPlayer)
            .Include(g => g.Moves)
            .Where(g => gameIds.Contains(g.Id))
            .OrderBy(g => g.CreatedAt)
            .ToListAsync();
    }
}

public record SeedUpdate(int UserId, int Seed);

