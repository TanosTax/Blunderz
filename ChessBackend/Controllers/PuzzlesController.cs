using Microsoft.AspNetCore.Mvc;
using ChessBackend.Services;
using ChessBackend.Data;
using Microsoft.EntityFrameworkCore;

namespace ChessBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PuzzlesController : ControllerBase
{
    private readonly IPuzzleService _puzzleService;
    private readonly ChessDbContext _context;

    public PuzzlesController(IPuzzleService puzzleService, ChessDbContext context)
    {
        _puzzleService = puzzleService;
        _context = context;
    }

    [HttpGet("random")]
    public async Task<IActionResult> GetRandomPuzzle([FromQuery] int userId, [FromQuery] int? rating = null)
    {
        var puzzle = await _puzzleService.GetRandomPuzzleAsync(userId, rating);
        if (puzzle == null)
        {
            return NotFound(new { message = "No puzzles available" });
        }

        return Ok(puzzle);
    }

    [HttpPost("check")]
    public async Task<IActionResult> CheckSolution([FromBody] CheckSolutionRequest request)
    {
        var user = await _context.Users.FindAsync(request.UserId);
        if (user == null) return NotFound("User not found");
        
        var oldRating = user.PuzzleRating;
        
        var isCorrect = await _puzzleService.CheckSolutionAsync(request.PuzzleId, request.Move);
        var attempt = await _puzzleService.RecordAttemptAsync(request.UserId, request.PuzzleId, isCorrect);

        // Reload user to get updated rating
        await _context.Entry(user).ReloadAsync();
        var ratingChange = user.PuzzleRating - oldRating;

        return Ok(new
        {
            correct = isCorrect,
            attempt = attempt,
            ratingChange = ratingChange,
            newRating = user.PuzzleRating,
            firstAttempt = attempt.Attempts == 1
        });
    }

    [HttpGet("stats/{userId}")]
    public async Task<IActionResult> GetUserStats(int userId)
    {
        var stats = await _puzzleService.GetUserStatsAsync(userId);
        return Ok(stats);
    }

    [HttpGet("theme/{theme}")]
    public async Task<IActionResult> GetPuzzlesByTheme(string theme, [FromQuery] int count = 10)
    {
        var puzzles = await _puzzleService.GetPuzzlesByThemeAsync(theme, count);
        return Ok(puzzles);
    }
}

public class CheckSolutionRequest
{
    public int UserId { get; set; }
    public int PuzzleId { get; set; }
    public string Move { get; set; } = string.Empty;
}
