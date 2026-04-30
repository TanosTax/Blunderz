using Microsoft.AspNetCore.Mvc;
using ChessBackend.Interfaces;
using ChessBackend.Models;

namespace ChessBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AnalysisController : ControllerBase
{
    private readonly IStockfishService _stockfishService;
    private readonly ILogger<AnalysisController> _logger;

    public AnalysisController(IStockfishService stockfishService, ILogger<AnalysisController> logger)
    {
        _stockfishService = stockfishService;
        _logger = logger;
    }

    [HttpPost("position")]
    public async Task<ActionResult<PositionAnalysis>> AnalyzePosition([FromBody] AnalyzePositionRequest request)
    {
        try
        {
            var analysis = await _stockfishService.AnalyzePosition(request.Fen, request.Depth ?? 20);
            return Ok(analysis);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to analyze position");
            return StatusCode(500, new { error = "Failed to analyze position", message = ex.Message });
        }
    }

    [HttpPost("game/{gameId}")]
    public async Task<ActionResult<GameAnalysis>> AnalyzeGame(Guid gameId)
    {
        try
        {
            _logger.LogInformation($"Starting analysis for game {gameId}");
            var analysis = await _stockfishService.AnalyzeGame(gameId);
            return Ok(analysis);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Failed to analyze game {gameId}");
            return StatusCode(500, new { error = "Failed to analyze game", message = ex.Message });
        }
    }
}

public record AnalyzePositionRequest(string Fen, int? Depth);
