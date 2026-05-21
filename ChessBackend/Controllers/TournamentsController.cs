using ChessBackend.Models;
using ChessBackend.Services;
using Microsoft.AspNetCore.Mvc;

namespace ChessBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TournamentsController : ControllerBase
{
    private readonly TournamentService _tournamentService;

    public TournamentsController(TournamentService tournamentService)
    {
        _tournamentService = tournamentService;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTournamentDto dto)
    {
        var (ok, error, tournament) = await _tournamentService.CreateAsync(
            dto.CreatorUserId,
            dto.RoomName,
            dto.Name,
            dto.TimeControl,
            dto.BestOf,
            dto.BreakMinutesBetweenRounds,
            dto.IsPrivate,
            dto.Password);

        if (!ok) return BadRequest(new { message = error });
        return Ok(ToDto(tournament!));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var t = await _tournamentService.GetByIdAsync(id);
        if (t == null) return NotFound();
        return Ok(ToDto(t));
    }

    [HttpGet("by-room/{roomName}")]
    public async Task<IActionResult> GetByRoom(string roomName)
    {
        var t = await _tournamentService.GetByRoomAsync(roomName);
        if (t == null) return NotFound();
        return Ok(ToDto(t));
    }

    [HttpGet("active")]
    public async Task<IActionResult> GetActive()
    {
        var tournaments = await _tournamentService.GetActiveTournamentsAsync();
        return Ok(tournaments.Select(ToDto));
    }

    [HttpGet("completed")]
    public async Task<IActionResult> GetCompleted([FromQuery] int limit = 50)
    {
        var tournaments = await _tournamentService.GetCompletedTournamentsAsync(limit);
        return Ok(tournaments.Select(ToDto));
    }

    [HttpGet("{id:guid}/games")]
    public async Task<IActionResult> GetTournamentGames(Guid id)
    {
        var games = await _tournamentService.GetTournamentGamesAsync(id);
        return Ok(games.Select(g => new
        {
            id = g.Id,
            whitePlayerId = g.WhitePlayerId,
            whitePlayerUsername = g.WhitePlayer.Username,
            blackPlayerId = g.BlackPlayerId,
            blackPlayerUsername = g.BlackPlayer.Username,
            result = g.Result?.ToString(),
            winnerId = g.WinnerId,
            status = g.Status.ToString(),
            timeControl = g.TimeControl,
            pgn = g.PGN,
            fen = g.FEN,
            moveCount = g.Moves.Count,
            createdAt = g.CreatedAt,
            completedAt = g.CompletedAt
        }));
    }

    [HttpPost("{id:guid}/join")]
    public async Task<IActionResult> Join(Guid id, [FromBody] JoinTournamentDto dto)
    {
        var (ok, error) = await _tournamentService.JoinAsync(id, dto.UserId, dto.Password);
        if (!ok) return BadRequest(new { message = error });

        var t = await _tournamentService.GetByIdAsync(id);
        return Ok(ToDto(t!));
    }

    [HttpPost("{id:guid}/leave")]
    public async Task<IActionResult> Leave(Guid id, [FromBody] LeaveTournamentDto dto)
    {
        var (ok, error) = await _tournamentService.LeaveAsync(id, dto.UserId);
        if (!ok) return BadRequest(new { message = error });

        var t = await _tournamentService.GetByIdAsync(id);
        return Ok(ToDto(t!));
    }

    [HttpPatch("{id:guid}/seeds")]
    public async Task<IActionResult> UpdateSeeds(Guid id, [FromBody] UpdateSeedsDto dto)
    {
        var (ok, error) = await _tournamentService.UpdateSeedsAsync(id, dto.CreatorUserId, dto.Seeds);
        if (!ok) return BadRequest(new { message = error });

        var t = await _tournamentService.GetByIdAsync(id);
        return Ok(ToDto(t!));
    }

    [HttpPost("{id:guid}/start")]
    public async Task<IActionResult> Start(Guid id, [FromBody] StartTournamentDto dto)
    {
        var (ok, error) = await _tournamentService.StartAsync(id, dto.CreatorUserId);
        if (!ok) return BadRequest(new { message = error });

        var t = await _tournamentService.GetByIdAsync(id);
        return Ok(ToDto(t!));
    }

    private static object ToDto(Tournament t)
    {
        return new
        {
            id = t.Id,
            roomName = t.RoomName,
            name = t.Name,
            creatorUserId = t.CreatorUserId,
            isPrivate = t.IsPrivate,
            timeControl = t.TimeControl,
            bestOf = t.BestOf,
            breakMinutesBetweenRounds = t.BreakMinutesBetweenRounds,
            status = t.Status.ToString(),
            currentRound = t.CurrentRound,
            roundReadyAt = t.RoundReadyAt,
            createdAt = t.CreatedAt,
            startedAt = t.StartedAt,
            completedAt = t.CompletedAt,
            participants = t.Participants
                .OrderBy(p => p.Seed)
                .Select(p => new
                {
                    id = p.Id,
                    userId = p.UserId,
                    username = p.User.Username,
                    seed = p.Seed,
                    status = p.Status.ToString(),
                    joinedAt = p.JoinedAt
                }),
            matches = t.Matches
                .OrderBy(m => m.RoundNumber).ThenBy(m => m.SlotIndex)
                .Select(m => new
                {
                    id = m.Id,
                    roundNumber = m.RoundNumber,
                    slotIndex = m.SlotIndex,
                    playerAId = m.PlayerAId,
                    playerBId = m.PlayerBId,
                    winnerId = m.WinnerId,
                    status = m.Status.ToString(),
                    bestOf = m.BestOf,
                    aWins = m.AWins,
                    bWins = m.BWins,
                    gameId = m.GameId,
                    createdAt = m.CreatedAt,
                    startedAt = m.StartedAt,
                    completedAt = m.CompletedAt
                })
        };
    }
}

public record CreateTournamentDto(
    int CreatorUserId,
    string RoomName,
    string Name,
    string TimeControl,
    int BestOf,
    int BreakMinutesBetweenRounds,
    bool IsPrivate,
    string? Password);

public record JoinTournamentDto(int UserId, string? Password);
public record LeaveTournamentDto(int UserId);
public record StartTournamentDto(int CreatorUserId);

public record UpdateSeedsDto(int CreatorUserId, List<SeedUpdate> Seeds);

