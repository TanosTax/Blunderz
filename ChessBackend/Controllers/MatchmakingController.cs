using Microsoft.AspNetCore.Mvc;
using ChessBackend.Interfaces;

namespace ChessBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MatchmakingController : ControllerBase
{
    private readonly IMatchmakingService _matchmakingService;
    private readonly ILogger<MatchmakingController> _logger;

    public MatchmakingController(
        IMatchmakingService matchmakingService,
        ILogger<MatchmakingController> logger)
    {
        _matchmakingService = matchmakingService;
        _logger = logger;
    }

    [HttpPost("join")]
    public async Task<IActionResult> JoinQueue([FromBody] JoinQueueDto dto)
    {
        var game = await _matchmakingService.FindMatchAsync(dto.UserId, dto.TimeControl, dto.EloRange);

        if (game != null)
        {
            return Ok(new { matched = true, gameId = game.Id });
        }

        return Ok(new { matched = false, message = "Added to queue" });
    }

    [HttpDelete("leave/{userId}")]
    public async Task<IActionResult> LeaveQueue(int userId)
    {
        var result = await _matchmakingService.LeaveQueueAsync(userId);

        if (result)
        {
            return Ok(new { message = "Left queue successfully" });
        }

        return NotFound(new { message = "User not in queue" });
    }
}

public record JoinQueueDto(int UserId, string TimeControl = "10+0", int EloRange = 200);
