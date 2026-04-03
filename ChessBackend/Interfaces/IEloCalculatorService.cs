namespace ChessBackend.Interfaces;

public interface IEloCalculatorService
{
    (int newWhiteElo, int newBlackElo) CalculateNewRatings(int whiteElo, int blackElo, GameResult result);
    int GetKFactor(int gamesPlayed, int currentElo);
}

public enum GameResult
{
    WhiteWin,
    BlackWin,
    Draw
}
