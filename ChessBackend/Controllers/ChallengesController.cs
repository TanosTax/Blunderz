using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ChessBackend.Data;
using ChessBackend.Models;

namespace ChessBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChallengesController : ControllerBase
{
    private readonly ChessDbContext _context;
    private readonly ILogger<ChallengesController> _logger;

    public ChallengesController(ChessDbContext context, ILogger<ChallengesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/challenges/pending/{userId}
    [HttpGet("pending/{userId}")]
    public async Task<ActionResult<object>> GetPendingChallenges(int userId)
    {
        var incoming = await _context.Challenges
            .Where(c => c.ChallengedId == userId && c.Status == ChallengeStatus.Pending && c.ExpiresAt > DateTime.UtcNow)
            .Include(c => c.Challenger)
            .Select(c => new
            {
                id = c.Id,
                challengerId = c.ChallengerId,
                challengerUsername = c.Challenger.Username,
                challengerElo = c.Challenger.Elo,
                timeControl = c.TimeControl,
                expiresAt = c.ExpiresAt,
                createdAt = c.CreatedAt
            })
            .ToListAsync();

        var outgoing = await _context.Challenges
            .Where(c => c.ChallengerId == userId && c.Status == ChallengeStatus.Pending && c.ExpiresAt > DateTime.UtcNow)
            .Include(c => c.Challenged)
            .Select(c => new
            {
                id = c.Id,
                challengedId = c.ChallengedId,
                challengedUsername = c.Challenged.Username,
                challengedElo = c.Challenged.Elo,
                timeControl = c.TimeControl,
                expiresAt = c.ExpiresAt,
                createdAt = c.CreatedAt
            })
            .ToListAsync();

        return Ok(new { incoming, outgoing });
    }
}
