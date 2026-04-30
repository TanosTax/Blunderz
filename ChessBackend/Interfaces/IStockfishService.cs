using ChessBackend.Models;

namespace ChessBackend.Interfaces;

public interface IStockfishService
{
    Task<PositionAnalysis> AnalyzePosition(string fen, int depth = 20);
    Task<GameAnalysis> AnalyzeGame(Guid gameId);
}
