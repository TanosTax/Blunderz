using Microsoft.AspNetCore.Mvc;
using ChessBackend.Services;

namespace ChessBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AICoachController : ControllerBase
{
    private readonly AICoachService _aiCoachService;
    private readonly ILogger<AICoachController> _logger;

    public AICoachController(AICoachService aiCoachService, ILogger<AICoachController> logger)
    {
        _aiCoachService = aiCoachService;
        _logger = logger;
    }

    [HttpPost("analyze/{gameId}")]
    public async Task<IActionResult> AnalyzeGame(Guid gameId, [FromQuery] string language = "en")
    {
        try
        {
            _logger.LogInformation($"AI analysis requested for game {gameId}, language: {language}");
            
            var result = await _aiCoachService.AnalyzeGameAsync(gameId, language);
            
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Failed to analyze game {gameId}");
            return StatusCode(500, new { error = "AI analysis failed" });
        }
    }

    [HttpPost("chat")]
    public async Task<IActionResult> Chat([FromBody] ChatRequest request)
    {
        try
        {
            _logger.LogInformation($"AI chat request: {request.Message.Substring(0, Math.Min(50, request.Message.Length))}..., language: {request.Language}");
            
            var result = await _aiCoachService.ChatAsync(request.Message, request.GameId, request.Language);
            
            return Ok(new { response = result });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process chat request");
            return StatusCode(500, new { error = "Chat failed" });
        }
    }
}

public class ChatRequest
{
    public string Message { get; set; } = string.Empty;
    public Guid? GameId { get; set; }
    public string Language { get; set; } = "en";
}
