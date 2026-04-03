using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ChessBackend.Data;
using ChessBackend.Models;

namespace ChessBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GamesController : ControllerBase
{
    private readonly ChessDbContext _context;
    private readonly ILogger<GamesController> _logger;

    public GamesController(ChessDbContext context, ILogger<GamesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Game>> GetGame(Guid id)
    {
        var game = await _context.Games
            .Include(g => g.WhitePlayer)
            .Include(g => g.BlackPlayer)
            .Include(g => g.Moves.OrderBy(m => m.MoveNumber))
            .FirstOrDefaultAsync(g => g.Id == id);
        
        if (game == null)
        {
            _logger.LogWarning($"Game {id} not found");
            return NotFound();
        }

        return game;
    }

    [HttpPost]
    public async Task<ActionResult<Game>> CreateGame(CreateGameDto dto)
    {
        var whitePlayer = await _context.Users.FindAsync(dto.WhitePlayerId);
        var blackPlayer = await _context.Users.FindAsync(dto.BlackPlayerId);

        if (whitePlayer == null || blackPlayer == null)
        {
            return BadRequest("Invalid player IDs");
        }

        var game = new Game
        {
            WhitePlayerId = dto.WhitePlayerId,
            BlackPlayerId = dto.BlackPlayerId,
            TimeControl = dto.TimeControl ?? "10+0",
            Status = GameStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _context.Games.Add(game);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetGame), new { id = game.Id }, game);
    }

    [HttpGet("user/{userId}")]
    public async Task<ActionResult<List<Game>>> GetUserGames(int userId)
    {
        var games = await _context.Games
            .Include(g => g.WhitePlayer)
            .Include(g => g.BlackPlayer)
            .Where(g => g.WhitePlayerId == userId || g.BlackPlayerId == userId)
            .OrderByDescending(g => g.CreatedAt)
            .ToListAsync();

        return games;
    }

    [HttpPost("{id}/start")]
    public async Task<ActionResult<Game>> StartGame(Guid id)
    {
        var game = await _context.Games.FindAsync(id);
        
        if (game == null)
        {
            return NotFound();
        }

        if (game.Status != GameStatus.Pending)
        {
            return BadRequest("Game already started");
        }

        game.Status = GameStatus.Active;
        game.StartedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return game;
    }

    [HttpPost("{id}/end")]
    public async Task<ActionResult<object>> EndGame(Guid id, EndGameDto dto)
    {
        var game = await _context.Games
            .Include(g => g.WhitePlayer)
            .Include(g => g.BlackPlayer)
            .FirstOrDefaultAsync(g => g.Id == id);
        
        if (game == null)
        {
            return NotFound();
        }

        if (game.Status == GameStatus.Completed)
        {
            return BadRequest("Game already completed");
        }

        game.Status = GameStatus.Completed;
        game.CompletedAt = DateTime.UtcNow;
        game.Result = dto.Result;
        game.WinnerId = dto.WinnerId;

        // Update player statistics
        var whitePlayer = game.WhitePlayer;
        var blackPlayer = game.BlackPlayer;

        // Store old Elo for response
        var oldWhiteElo = whitePlayer.Elo;
        var oldBlackElo = blackPlayer.Elo;

        whitePlayer.GamesPlayed++;
        blackPlayer.GamesPlayed++;

        switch (dto.Result)
        {
            case GameResult.WhiteWin:
                whitePlayer.Wins++;
                blackPlayer.Losses++;
                break;
            case GameResult.BlackWin:
                blackPlayer.Wins++;
                whitePlayer.Losses++;
                break;
            case GameResult.Draw:
            case GameResult.Stalemate:
                whitePlayer.Draws++;
                blackPlayer.Draws++;
                break;
        }

        // Update Elo ratings
        var eloResult = dto.Result switch
        {
            GameResult.WhiteWin => Interfaces.GameResult.WhiteWin,
            GameResult.BlackWin => Interfaces.GameResult.BlackWin,
            _ => Interfaces.GameResult.Draw
        };

        var eloCalculator = HttpContext.RequestServices.GetRequiredService<Interfaces.IEloCalculatorService>();
        var (newWhiteElo, newBlackElo) = eloCalculator.CalculateNewRatings(
            whitePlayer.Elo, blackPlayer.Elo, eloResult);

        whitePlayer.Elo = newWhiteElo;
        blackPlayer.Elo = newBlackElo;

        await _context.SaveChangesAsync();

        _logger.LogInformation($"Game {id} ended with result {dto.Result}. White Elo: {oldWhiteElo} -> {newWhiteElo}, Black Elo: {oldBlackElo} -> {newBlackElo}");

        // Return game with Elo changes
        return Ok(new
        {
            game = game,
            eloChanges = new
            {
                whitePlayerId = whitePlayer.Id,
                blackPlayerId = blackPlayer.Id,
                whiteOldElo = oldWhiteElo,
                whiteNewElo = newWhiteElo,
                whiteChange = newWhiteElo - oldWhiteElo,
                blackOldElo = oldBlackElo,
                blackNewElo = newBlackElo,
                blackChange = newBlackElo - oldBlackElo
            }
        });
    }
}

public record CreateGameDto(int WhitePlayerId, int BlackPlayerId, string? TimeControl);

public record EndGameDto(GameResult Result, int? WinnerId);

