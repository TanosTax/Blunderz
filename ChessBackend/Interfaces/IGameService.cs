using ChessBackend.Models;

namespace ChessBackend.Interfaces;

public interface IGameService
{
    Task<Game?> CreateGameAsync(int whitePlayerId, int blackPlayerId, string timeControl);
    Task<bool> MakeMoveAsync(Guid gameId, string san, string fen);
    Task<bool> EndGameAsync(Guid gameId, Models.GameResult result, int? winnerId = null);
    Task<bool> ValidateMoveAsync(Guid gameId, int userId, string san);
}
