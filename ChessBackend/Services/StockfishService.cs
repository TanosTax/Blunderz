using System.Diagnostics;
using System.Text.RegularExpressions;
using ChessBackend.Data;
using ChessBackend.Interfaces;
using ChessBackend.Models;
using Microsoft.EntityFrameworkCore;

namespace ChessBackend.Services;

public class StockfishService : IStockfishService, IDisposable
{
    private readonly Process _stockfishProcess;
    private readonly StreamWriter _input;
    private readonly StreamReader _output;
    private readonly ILogger<StockfishService> _logger;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly SemaphoreSlim _semaphore = new(1, 1);

    public StockfishService(ILogger<StockfishService> logger, IServiceScopeFactory scopeFactory)
    {
        _logger = logger;
        _scopeFactory = scopeFactory;

        // Start Stockfish process
        _stockfishProcess = new Process
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = "stockfish",
                UseShellExecute = false,
                RedirectStandardInput = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                CreateNoWindow = true
            }
        };

        _stockfishProcess.Start();
        _input = _stockfishProcess.StandardInput;
        _output = _stockfishProcess.StandardOutput;

        // Initialize UCI
        SendCommand("uci");
        WaitForResponse("uciok");
        SendCommand("isready");
        WaitForResponse("readyok");

        _logger.LogInformation("Stockfish initialized successfully");
    }

    public async Task<PositionAnalysis> AnalyzePosition(string fen, int depth = 20)
    {
        await _semaphore.WaitAsync();
        try
        {
            // Check if process is still alive
            if (_stockfishProcess.HasExited)
            {
                _logger.LogError("Stockfish process has exited. Cannot analyze position.");
                throw new Exception("Stockfish process is not running");
            }

            _logger.LogInformation($"Analyzing position: {fen}");

            // Set position
            SendCommand($"position fen {fen}");
            SendCommand($"go depth {depth}");

            // Parse output
            string? line;
            string bestMove = "";
            double evaluation = 0;
            int analyzedDepth = 0;
            List<string> pv = new();

            var timeout = DateTime.UtcNow.AddSeconds(30); // 30 second timeout

            while ((line = await _output.ReadLineAsync()) != null)
            {
                if (DateTime.UtcNow > timeout)
                {
                    _logger.LogWarning("Analysis timeout reached");
                    break;
                }

                if (line.StartsWith("bestmove"))
                {
                    var parts = line.Split(' ');
                    bestMove = parts.Length > 1 ? parts[1] : "";
                    break;
                }

                if (line.StartsWith("info") && line.Contains("depth"))
                {
                    // Parse evaluation
                    var match = Regex.Match(line, @"score cp (-?\d+)");
                    if (match.Success)
                    {
                        evaluation = int.Parse(match.Groups[1].Value);
                    }
                    else
                    {
                        // Mate score
                        match = Regex.Match(line, @"score mate (-?\d+)");
                        if (match.Success)
                        {
                            int mateIn = int.Parse(match.Groups[1].Value);
                            evaluation = mateIn > 0 ? 10000 : -10000;
                        }
                    }

                    // Parse depth
                    match = Regex.Match(line, @"depth (\d+)");
                    if (match.Success)
                    {
                        analyzedDepth = int.Parse(match.Groups[1].Value);
                    }

                    // Parse principal variation
                    match = Regex.Match(line, @"pv (.+)");
                    if (match.Success)
                    {
                        pv = match.Groups[1].Value.Split(' ').ToList();
                    }
                }
            }

            return new PositionAnalysis
            {
                Fen = fen,
                Evaluation = evaluation,
                BestMove = bestMove,
                Depth = analyzedDepth,
                PrincipalVariation = pv,
                Classification = MoveClassification.Best // Will be calculated when comparing moves
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error analyzing position");
            throw;
        }
        finally
        {
            _semaphore.Release();
        }
    }

    public async Task<GameAnalysis> AnalyzeGame(Guid gameId)
    {
        _logger.LogInformation($"Analyzing game: {gameId}");

        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ChessDbContext>();

        var game = await context.Games
            .Include(g => g.Moves.OrderBy(m => m.MoveNumber))
            .FirstOrDefaultAsync(g => g.Id == gameId);

        if (game == null)
        {
            throw new Exception($"Game {gameId} not found");
        }

        _logger.LogInformation($"Found game with {game.Moves.Count} moves");

        var analysis = new GameAnalysis
        {
            GameId = gameId,
            AnalyzedAt = DateTime.UtcNow
        };

        // Start from initial position
        string currentFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
        double previousEval = 0;

        for (int i = 0; i < game.Moves.Count; i++)
        {
            var move = game.Moves.ElementAt(i);
            bool isWhiteMove = i % 2 == 0;
            
            try
            {
                _logger.LogInformation($"Analyzing move {i + 1}/{game.Moves.Count}: {move.SAN}");
                
                // Check if FEN is empty
                if (string.IsNullOrEmpty(move.FEN))
                {
                    _logger.LogError($"Move {i + 1} has empty FEN! Skipping analysis for this move.");
                    continue;
                }
                
                // Check if this is a checkmate move (ends with #)
                bool isCheckmateMove = move.SAN.EndsWith("#");
                
                if (isCheckmateMove)
                {
                    _logger.LogInformation($"Move {i + 1} ({move.SAN}) is checkmate!");
                    
                    // Analyze position before move to get evaluation
                    _logger.LogInformation($"Analyzing position before checkmate: {currentFen}");
                    var analysisBeforeMate = await AnalyzePosition(currentFen, 12);
                    
                    var mateMove = new MoveAnalysis
                    {
                        MoveNumber = move.MoveNumber,
                        Move = move.SAN,
                        Fen = currentFen,
                        EvaluationBefore = analysisBeforeMate.Evaluation,
                        EvaluationAfter = isWhiteMove ? 10000 : -10000, // Mate score
                        BestMove = analysisBeforeMate.BestMove,
                        Classification = MoveClassification.Brilliant,
                        CentipawnsLost = 0
                    };
                    
                    analysis.Moves.Add(mateMove);
                    
                    var playerPerf = isWhiteMove ? analysis.WhitePerformance : analysis.BlackPerformance;
                    playerPerf.Brilliant++;
                    
                    currentFen = move.FEN;
                    continue;
                }
                
                // Analyze position before move (reduced depth for stability)
                _logger.LogInformation($"Analyzing position before move: {currentFen}");
                var analysisBefore = await AnalyzePosition(currentFen, 12);
                _logger.LogInformation($"Before eval: {analysisBefore.Evaluation}");
                
                // Get FEN after move from database
                string newFen = move.FEN;
                _logger.LogInformation($"FEN after move: {newFen}");
                
                // Analyze position after move
                var analysisAfter = await AnalyzePosition(newFen, 12);
                _logger.LogInformation($"After eval: {analysisAfter.Evaluation}");

                // Calculate evaluation from white's perspective
                double evalBefore = analysisBefore.Evaluation;
                double evalAfter = analysisAfter.Evaluation;
                
                _logger.LogInformation($"Move {i + 1} ({move.SAN}): evalBefore={evalBefore}, evalAfter={evalAfter}, isWhiteMove={isWhiteMove}");
                
                // Check for mate scores (absolute value > 9000)
                bool isMateBefore = Math.Abs(evalBefore) > 9000;
                bool isMateAfter = Math.Abs(evalAfter) > 9000;
                
                // If this move delivers checkmate FOR THE PLAYER WHO MOVED, it's brilliant
                // White moves and gets positive mate score, or Black moves and gets negative mate score
                bool deliveredMate = isMateAfter && !isMateBefore && 
                                    ((isWhiteMove && evalAfter > 9000) || (!isWhiteMove && evalAfter < -9000));
                
                _logger.LogInformation($"Mate check: isMateBefore={isMateBefore}, isMateAfter={isMateAfter}, deliveredMate={deliveredMate}");
                
                if (deliveredMate)
                {
                    var mateMove = new MoveAnalysis
                    {
                        MoveNumber = move.MoveNumber,
                        Move = move.SAN,
                        Fen = currentFen,
                        EvaluationBefore = evalBefore,
                        EvaluationAfter = evalAfter,
                        BestMove = analysisBefore.BestMove,
                        Classification = MoveClassification.Brilliant,
                        CentipawnsLost = 0
                    };
                    
                    analysis.Moves.Add(mateMove);
                    
                    var playerPerf = isWhiteMove ? analysis.WhitePerformance : analysis.BlackPerformance;
                    playerPerf.Brilliant++;
                    
                    _logger.LogInformation($"Move {i + 1} delivers checkmate: Brilliant!");
                    
                    currentFen = newFen;
                    previousEval = evalAfter;
                    continue;
                }
                
                // If opponent now has mate (we allowed mate in 1), it's a blunder
                bool allowedMate = !isMateBefore && isMateAfter &&
                                  ((isWhiteMove && evalAfter < -9000) || (!isWhiteMove && evalAfter > 9000));
                
                if (allowedMate)
                {
                    var blunderMove = new MoveAnalysis
                    {
                        MoveNumber = move.MoveNumber,
                        Move = move.SAN,
                        Fen = currentFen,
                        EvaluationBefore = evalBefore,
                        EvaluationAfter = evalAfter,
                        BestMove = analysisBefore.BestMove,
                        Classification = MoveClassification.Blunder,
                        CentipawnsLost = 10000 // Huge loss
                    };
                    
                    analysis.Moves.Add(blunderMove);
                    
                    var playerPerf = isWhiteMove ? analysis.WhitePerformance : analysis.BlackPerformance;
                    playerPerf.Blunders++;
                    
                    _logger.LogInformation($"Move {i + 1} allows checkmate: Blunder!");
                    
                    currentFen = newFen;
                    previousEval = evalAfter;
                    continue;
                }
                
                // Calculate centipawns lost
                // For white: if eval drops from +200 to +100, that's 100 cp lost
                // For black: if eval rises from -200 to -100, that's 100 cp lost (position got worse for black)
                double cpLost;
                if (isWhiteMove)
                {
                    cpLost = Math.Max(0, evalBefore - evalAfter);  // White: losing eval is bad
                }
                else
                {
                    cpLost = Math.Max(0, -(evalBefore - evalAfter)); // Black: gaining eval (from white's perspective) is bad for black
                }

                // Classify move
                var classification = ClassifyMove(cpLost, evalBefore, evalAfter, isWhiteMove);

                var moveAnalysis = new MoveAnalysis
                {
                    MoveNumber = move.MoveNumber,
                    Move = move.SAN,
                    Fen = currentFen,
                    EvaluationBefore = evalBefore,
                    EvaluationAfter = evalAfter,
                    BestMove = analysisBefore.BestMove,
                    Classification = classification,
                    CentipawnsLost = cpLost
                };

                analysis.Moves.Add(moveAnalysis);
                _logger.LogInformation($"Move {i + 1} analyzed: {classification}, CP lost: {cpLost}");

                // Update player performance
                var performance = isWhiteMove ? analysis.WhitePerformance : analysis.BlackPerformance;
                UpdatePerformance(performance, classification, cpLost);

                currentFen = newFen;
                previousEval = evalAfter;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to analyze move {i + 1}: {move.SAN}");
                // Continue with next move instead of failing entire analysis
            }
        }

        _logger.LogInformation($"Analysis complete. Analyzed {analysis.Moves.Count} moves");

        // Calculate average accuracy
        CalculateAverageAccuracy(analysis.WhitePerformance, analysis.Moves.Count(m => m.MoveNumber % 2 == 1));
        CalculateAverageAccuracy(analysis.BlackPerformance, analysis.Moves.Count(m => m.MoveNumber % 2 == 0));

        return analysis;
    }

    private MoveClassification ClassifyMove(double cpLost, double evalBefore, double evalAfter, bool isWhiteMove)
    {
        // Calculate actual change in evaluation
        double evalChange = evalAfter - evalBefore;
        
        // For white moves, positive change is good; for black moves, negative change is good
        double effectiveChange = isWhiteMove ? evalChange : -evalChange;

        // Brilliant move: significant improvement (300+ centipawns)
        if (effectiveChange > 300)
            return MoveClassification.Brilliant;

        // Great move: good improvement (100-300 centipawns)
        if (effectiveChange > 100)
            return MoveClassification.Great;

        // Best move: within 50 centipawns of optimal
        if (cpLost < 50)
            return MoveClassification.Best;

        // Good move: within 100 centipawns
        if (cpLost < 100)
            return MoveClassification.Good;

        // Inaccuracy: 100-200 centipawns lost
        if (cpLost < 200)
            return MoveClassification.Inaccuracy;

        // Mistake: 200-400 centipawns lost
        if (cpLost < 400)
            return MoveClassification.Mistake;

        // Blunder: 400+ centipawns lost
        return MoveClassification.Blunder;
    }

    private void UpdatePerformance(PlayerPerformance performance, MoveClassification classification, double cpLost)
    {
        switch (classification)
        {
            case MoveClassification.Brilliant:
                performance.Brilliant++;
                break;
            case MoveClassification.Great:
                performance.Great++;
                break;
            case MoveClassification.Best:
                performance.Best++;
                break;
            case MoveClassification.Good:
                performance.Good++;
                break;
            case MoveClassification.Inaccuracy:
                performance.Inaccuracies++;
                break;
            case MoveClassification.Mistake:
                performance.Mistakes++;
                break;
            case MoveClassification.Blunder:
                performance.Blunders++;
                break;
        }
    }

    private void CalculateAverageAccuracy(PlayerPerformance performance, int totalMoves)
    {
        if (totalMoves == 0) return;

        // Calculate accuracy based on move quality
        int totalPoints = performance.Brilliant * 100 + performance.Great * 95 + 
                         performance.Best * 90 + performance.Good * 80 +
                         performance.Inaccuracies * 60 + performance.Mistakes * 40 + 
                         performance.Blunders * 20;

        performance.AverageAccuracy = (double)totalPoints / totalMoves;
    }

    private void SendCommand(string command)
    {
        try
        {
            if (_stockfishProcess.HasExited)
            {
                throw new Exception("Stockfish process has exited");
            }
            
            _input.WriteLine(command);
            _input.Flush();
            _logger.LogDebug($"Sent command: {command}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Failed to send command: {command}");
            throw;
        }
    }

    private void WaitForResponse(string expectedResponse)
    {
        string? line;
        while ((line = _output.ReadLine()) != null)
        {
            if (line.Contains(expectedResponse))
                break;
        }
    }

    public void Dispose()
    {
        SendCommand("quit");
        _stockfishProcess?.WaitForExit(1000);
        _stockfishProcess?.Kill();
        _stockfishProcess?.Dispose();
        _semaphore?.Dispose();
    }
}
