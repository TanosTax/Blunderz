namespace ChessBackend.Models;

public class PositionAnalysis
{
    public string Fen { get; set; } = string.Empty;
    public double Evaluation { get; set; } // In centipawns (100 = 1 pawn advantage)
    public string BestMove { get; set; } = string.Empty;
    public string? BestMoveSan { get; set; } // Standard Algebraic Notation
    public MoveClassification Classification { get; set; }
    public int Depth { get; set; }
    public List<string> PrincipalVariation { get; set; } = new();
}

public enum MoveClassification
{
    Brilliant,      // Evaluation improved by 300+ centipawns
    Great,          // Evaluation improved by 100-300 centipawns
    Best,           // Best move or within 50 centipawns
    Good,           // Within 100 centipawns of best
    Inaccuracy,     // Lost 100-200 centipawns
    Mistake,        // Lost 200-400 centipawns
    Blunder         // Lost 400+ centipawns
}
