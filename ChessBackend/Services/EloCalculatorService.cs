using ChessBackend.Interfaces;

namespace ChessBackend.Services;

public class EloCalculatorService : IEloCalculatorService
{
    public (int newWhiteElo, int newBlackElo) CalculateNewRatings(int whiteElo, int blackElo, GameResult result)
    {
        // Expected scores
        double expectedWhite = 1.0 / (1.0 + Math.Pow(10, (blackElo - whiteElo) / 400.0));
        double expectedBlack = 1.0 / (1.0 + Math.Pow(10, (whiteElo - blackElo) / 400.0));

        // Actual scores
        double actualWhite = result switch
        {
            GameResult.WhiteWin => 1.0,
            GameResult.BlackWin => 0.0,
            GameResult.Draw => 0.5,
            _ => 0.5
        };
        double actualBlack = 1.0 - actualWhite;

        // K-factor based on rating (higher rating = more stable)
        int kFactorWhite = GetKFactorByRating(whiteElo);
        int kFactorBlack = GetKFactorByRating(blackElo);

        // Calculate new ratings
        int newWhiteElo = whiteElo + (int)Math.Round(kFactorWhite * (actualWhite - expectedWhite));
        int newBlackElo = blackElo + (int)Math.Round(kFactorBlack * (actualBlack - expectedBlack));

        return (newWhiteElo, newBlackElo);
    }

    private int GetKFactorByRating(int elo)
    {
        // Новички (< 1400) - K=32 (быстрый рост)
        if (elo < 1400)
            return 32;

        // Сильные игроки (> 2000) - K=16 (стабильный рейтинг)
        if (elo >= 2000)
            return 16;

        // Средние игроки - K=24
        return 24;
    }

    public int GetKFactor(int gamesPlayed, int currentElo)
    {
        // Новички (< 30 игр) - K=32
        if (gamesPlayed < 30)
            return 32;

        // Сильные игроки (Elo > 2400) - K=16
        if (currentElo >= 2400)
            return 16;

        // Остальные - K=24
        return 24;
    }
}
