using ChessBackend.Models;

namespace ChessBackend.Interfaces;

public interface IMatchmakingService
{
    Task<Game?> FindMatchAsync(int userId, string timeControl, int eloRange = 200);
    Task<bool> JoinQueueAsync(int userId, string timeControl, int eloRange = 200);
    Task<bool> LeaveQueueAsync(int userId);
}
