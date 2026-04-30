using System.Text;
using System.Text.Json;
using ChessBackend.Data;
using ChessBackend.Models;
using ChessBackend.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ChessBackend.Services;

public class AICoachService
{
    private readonly ChessDbContext _context;
    private readonly IStockfishService _stockfishService;
    private readonly ILogger<AICoachService> _logger;
    private readonly HttpClient _httpClient;
    private readonly string _ollamaUrl;

    public AICoachService(
        ChessDbContext context,
        IStockfishService stockfishService,
        ILogger<AICoachService> logger,
        IConfiguration configuration,
        HttpClient httpClient)
    {
        _context = context;
        _stockfishService = stockfishService;
        _logger = logger;
        _httpClient = httpClient;
        _ollamaUrl = configuration["Ollama:Url"] ?? "http://localhost:11434";
    }

    public async Task<AIAnalysisResult> AnalyzeGameAsync(Guid gameId, string language = "en")
    {
        _logger.LogInformation($"Starting AI analysis for game {gameId}");
        
        // Load game with moves
        var game = await _context.Games
            .Include(g => g.Moves.OrderBy(m => m.MoveNumber))
            .Include(g => g.WhitePlayer)
            .Include(g => g.BlackPlayer)
            .FirstOrDefaultAsync(g => g.Id == gameId);

        if (game == null)
        {
            _logger.LogError($"Game {gameId} not found");
            throw new ArgumentException("Game not found");
        }

        _logger.LogInformation($"Game loaded: {game.WhitePlayer.Username} vs {game.BlackPlayer.Username}, {game.Moves.Count} moves");

        // Get Stockfish analysis
        _logger.LogInformation("Starting Stockfish analysis...");
        var stockfishAnalysis = await _stockfishService.AnalyzeGame(gameId);
        _logger.LogInformation("Stockfish analysis complete");

        // Build PGN
        var pgn = BuildPGN(game);
        _logger.LogInformation($"PGN generated: {pgn.Length} characters");

        // Create prompt for Ollama
        var prompt = BuildAnalysisPrompt(game, stockfishAnalysis, pgn, language);
        _logger.LogInformation($"Prompt created: {prompt.Length} characters");

        // Call Ollama API
        _logger.LogInformation("Calling Ollama API...");
        var aiResponse = await CallOllamaAPI(prompt);
        _logger.LogInformation($"Ollama API response received: {aiResponse.Length} characters");

        // Parse and return result
        return new AIAnalysisResult
        {
            GameId = gameId,
            Analysis = aiResponse,
            GeneratedAt = DateTime.UtcNow
        };
    }

    private string BuildPGN(Game game)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"[White \"{game.WhitePlayer.Username}\"]");
        sb.AppendLine($"[Black \"{game.BlackPlayer.Username}\"]");
        sb.AppendLine($"[Result \"{GetResultString(game.Result)}\"]");
        sb.AppendLine($"[TimeControl \"{game.TimeControl}\"]");
        sb.AppendLine();

        var moveNumber = 1;
        for (int i = 0; i < game.Moves.Count; i++)
        {
            if (i % 2 == 0)
            {
                sb.Append($"{moveNumber}. ");
            }

            sb.Append($"{game.Moves.ElementAt(i).SAN} ");

            if (i % 2 == 1)
            {
                moveNumber++;
            }
        }

        return sb.ToString();
    }

    private string GetResultString(Models.GameResult? result)
    {
        return result switch
        {
            Models.GameResult.WhiteWin => "1-0",
            Models.GameResult.BlackWin => "0-1",
            Models.GameResult.Draw => "1/2-1/2",
            Models.GameResult.Stalemate => "1/2-1/2",
            _ => "*"
        };
    }

    private string BuildAnalysisPrompt(Game game, object stockfishAnalysis, string pgn, string language)
    {
        var analysisJson = JsonSerializer.Serialize(stockfishAnalysis);
        var isRussian = language == "ru";

        var promptTemplate = isRussian ? 
@"Ты эксперт-шахматный тренер, анализирующий партию. Предоставь детальную, персонализированную обратную связь на русском языке.

Информация об игре:
- Белые: {0} (Elo: {1})
- Черные: {2} (Elo: {3})
- Контроль времени: {4}
- Результат: {5}

PGN:
{6}

Анализ Stockfish:
{7}

Пожалуйста, предоставь комплексный анализ на русском языке в следующем формате:

1. ОБЩАЯ ОЦЕНКА (2-3 предложения о качестве игры и ключевых поворотных моментах)

2. ФАЗА ДЕБЮТА (ходы 1-10):
   - Что прошло хорошо
   - Допущенные ошибки
   - Лучшие альтернативы

3. ФАЗА МИТТЕЛЬШПИЛЯ (ходы 11-25):
   - Стратегические идеи
   - Упущенные тактические возможности
   - Ключевые ошибки

4. ФАЗА ЭНДШПИЛЯ (если применимо, ходы 25+):
   - Оценка техники
   - Критические ошибки
   - Шансы на победу/ничью

5. КРИТИЧЕСКИЕ МОМЕНТЫ (3-5 самых важных позиций, где решалась игра)

6. РЕКОМЕНДАЦИИ:
   - Какая фаза требует наибольшего улучшения (Дебют/Миттельшпиль/Эндшпиль)
   - Конкретные концепции для изучения
   - Предложения по тренировке

Тон должен быть ободряющим, но честным. Фокусируйся на возможностях для обучения." :
@"You are an expert chess coach analyzing a game. Provide detailed, personalized feedback in English.

Game Information:
- White: {0} (Elo: {1})
- Black: {2} (Elo: {3})
- Time Control: {4}
- Result: {5}

PGN:
{6}

Stockfish Analysis:
{7}

Please provide a comprehensive analysis in English in the following format:

1. OVERALL ASSESSMENT (2-3 sentences about the game quality and key turning points)

2. OPENING PHASE (moves 1-10):
   - What went well
   - Mistakes made
   - Better alternatives

3. MIDDLEGAME PHASE (moves 11-25):
   - Strategic ideas
   - Tactical opportunities missed
   - Key mistakes

4. ENDGAME PHASE (if applicable, moves 25+):
   - Technique evaluation
   - Critical errors
   - Winning/drawing chances

5. CRITICAL MOMENTS (3-5 most important positions where the game was decided)

6. RECOMMENDATIONS:
   - Which phase needs most improvement (Opening/Middlegame/Endgame)
   - Specific concepts to study
   - Training suggestions

Keep the tone encouraging but honest. Focus on learning opportunities.";

        return string.Format(promptTemplate,
            game.WhitePlayer.Username,
            game.WhitePlayer.Elo,
            game.BlackPlayer.Username,
            game.BlackPlayer.Elo,
            game.TimeControl,
            GetResultString(game.Result),
            pgn,
            analysisJson);
    }

    private async Task<string> CallOllamaAPI(string prompt)
    {
        try
        {
            _logger.LogInformation("Preparing Ollama API request...");
            
            var requestBody = new
            {
                model = "qwen2.5:3b",
                prompt = $@"You are a professional chess coach providing detailed game analysis.

{prompt}",
                stream = false,
                options = new
                {
                    temperature = 0.7,
                    num_predict = 1024  // Limit response length for speed
                }
            };

            var json = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            _logger.LogInformation($"Sending request to Ollama at {_ollamaUrl}");
            var response = await _httpClient.PostAsync($"{_ollamaUrl}/api/generate", content);
            
            var responseContent = await response.Content.ReadAsStringAsync();
            _logger.LogInformation($"Ollama API response status: {response.StatusCode}");
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError($"Ollama API error: {response.StatusCode} - {responseContent}");
                throw new Exception($"Ollama API returned {response.StatusCode}: {responseContent}");
            }

            var responseObj = JsonSerializer.Deserialize<JsonElement>(responseContent);
            var aiResponse = responseObj.GetProperty("response").GetString();

            return aiResponse ?? "Analysis failed";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to call Ollama API");
            throw new Exception($"AI analysis failed: {ex.Message}", ex);
        }
    }

    public async Task<string> ChatAsync(string message, Guid? gameId = null, string language = "en")
    {
        _logger.LogInformation($"Chat request: {message.Substring(0, Math.Min(50, message.Length))}..., language: {language}");

        var isRussian = language == "ru";
        
        string prompt;

        if (isRussian)
        {
            // Stronger Russian prompt with examples
            var contextInfo = "";
            if (gameId.HasValue)
            {
                var game = await _context.Games
                    .Include(g => g.Moves.OrderBy(m => m.MoveNumber))
                    .Include(g => g.WhitePlayer)
                    .Include(g => g.BlackPlayer)
                    .FirstOrDefaultAsync(g => g.Id == gameId.Value);

                if (game != null)
                {
                    var pgn = BuildPGN(game);
                    contextInfo = $@"
Контекст игры:
Игра: {game.WhitePlayer.Username} (Белые) против {game.BlackPlayer.Username} (Черные)
Результат: {GetResultString(game.Result)}
PGN: {pgn}
";
                }
            }

            prompt = $@"Ты профессиональный шахматный тренер. ВАЖНО: Отвечай ТОЛЬКО на русском языке. Не используй английские слова.

{contextInfo}

Вопрос: {message}

Дай полезный и краткий ответ полностью на русском языке. Не смешивай русский и английский.";
        }
        else
        {
            // English prompt
            var contextInfo = "";
            if (gameId.HasValue)
            {
                var game = await _context.Games
                    .Include(g => g.Moves.OrderBy(m => m.MoveNumber))
                    .Include(g => g.WhitePlayer)
                    .Include(g => g.BlackPlayer)
                    .FirstOrDefaultAsync(g => g.Id == gameId.Value);

                if (game != null)
                {
                    var pgn = BuildPGN(game);
                    contextInfo = $@"
Game context:
Game: {game.WhitePlayer.Username} (White) vs {game.BlackPlayer.Username} (Black)
Result: {GetResultString(game.Result)}
PGN: {pgn}
";
                }
            }

            prompt = $@"You are a professional chess coach. Answer in English only.

{contextInfo}

Question: {message}

Provide a helpful and concise answer in English.";
        }

        var response = await CallOllamaAPI(prompt);
        return response;
    }
}

public class AIAnalysisResult
{
    public Guid GameId { get; set; }
    public string Analysis { get; set; } = string.Empty;
    public DateTime GeneratedAt { get; set; }
}
