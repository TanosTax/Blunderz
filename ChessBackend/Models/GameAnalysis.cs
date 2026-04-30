namespace ChessBackend.Models;

public class GameAnalysis
{
    public Guid GameId { get; set; }
    public List<MoveAnalysis> Moves { get; set; } = new();
    public PlayerPerformance WhitePerformance { get; set; } = new();
    public PlayerPerformance BlackPerformance { get; set; } = new();
    public DateTime AnalyzedAt { get; set; }
}

public class MoveAnalysis
{
    public int MoveNumber { get; set; }
    public string Move { get; set; } = string.Empty;
    public string Fen { get; set; } = string.Empty;
    public double EvaluationBefore { get; set; }
    public double EvaluationAfter { get; set; }
    public string BestMove { get; set; } = string.Empty;
    public MoveClassification Classification { get; set; }
    public double CentipawnsLost { get; set; }
}

public class PlayerPerformance
{
    public int Brilliant { get; set; }
    public int Great { get; set; }
    public int Best { get; set; }
    public int Good { get; set; }
    public int Inaccuracies { get; set; }
    public int Mistakes { get; set; }
    public int Blunders { get; set; }
    public double AverageAccuracy { get; set; }
    public double AverageCentipawnsLost { get; set; }
}
