using ChessBackend.Data;
using ChessBackend.Models;
using Microsoft.EntityFrameworkCore;

namespace ChessBackend.Services;

public interface IPuzzleService
{
    Task<Puzzle?> GetRandomPuzzleAsync(int userId, int? targetRating = null);
    Task<bool> CheckSolutionAsync(int puzzleId, string move);
    Task<UserPuzzleAttempt> RecordAttemptAsync(int userId, int puzzleId, bool solved);
    Task<List<Puzzle>> GetPuzzlesByThemeAsync(string theme, int count = 10);
    Task<Dictionary<string, int>> GetUserStatsAsync(int userId);
}

public class PuzzleService : IPuzzleService
{
    private readonly ChessDbContext _context;

    public PuzzleService(ChessDbContext context)
    {
        _context = context;
    }

    public async Task<Puzzle?> GetRandomPuzzleAsync(int userId, int? targetRating = null)
    {
        // Get user's attempted puzzle IDs
        var attemptedIds = await _context.UserPuzzleAttempts
            .Where(a => a.UserId == userId)
            .Select(a => a.PuzzleId)
            .ToListAsync();

        // Get puzzles not attempted by user
        var query = _context.Puzzles
            .Where(p => !attemptedIds.Contains(p.Id));

        // Filter by rating range if specified
        if (targetRating.HasValue)
        {
            var minRating = targetRating.Value - 200;
            var maxRating = targetRating.Value + 200;
            query = query.Where(p => p.Rating >= minRating && p.Rating <= maxRating);
        }

        // Get random puzzle
        var count = await query.CountAsync();
        if (count == 0)
        {
            // If all puzzles attempted, get any puzzle
            query = _context.Puzzles.AsQueryable();
            count = await query.CountAsync();
            if (count == 0) return null;
        }

        var random = new Random();
        var skip = random.Next(0, count);
        
        return await query.Skip(skip).FirstOrDefaultAsync();
    }

    public async Task<bool> CheckSolutionAsync(int puzzleId, string move)
    {
        var puzzle = await _context.Puzzles.FindAsync(puzzleId);
        if (puzzle == null) return false;

        var correctMoves = puzzle.Moves.Split(',', StringSplitOptions.RemoveEmptyEntries);
        return correctMoves.Contains(move.Trim());
    }

    public async Task<UserPuzzleAttempt> RecordAttemptAsync(int userId, int puzzleId, bool solved)
    {
        var existingAttempt = await _context.UserPuzzleAttempts
            .FirstOrDefaultAsync(a => a.UserId == userId && a.PuzzleId == puzzleId);

        var user = await _context.Users.FindAsync(userId);
        var puzzle = await _context.Puzzles.FindAsync(puzzleId);
        
        if (user == null || puzzle == null) 
            throw new Exception("User or puzzle not found");

        if (existingAttempt != null)
        {
            existingAttempt.Attempts++;
            existingAttempt.AttemptedAt = DateTime.UtcNow;
            
            // Only update if solved for the first time
            if (solved && !existingAttempt.Solved)
            {
                existingAttempt.Solved = true;
                // No rating change on retry
            }
            
            await _context.SaveChangesAsync();
            return existingAttempt;
        }

        // First attempt - calculate rating change
        var attempt = new UserPuzzleAttempt
        {
            UserId = userId,
            PuzzleId = puzzleId,
            Solved = solved,
            Attempts = 1,
            AttemptedAt = DateTime.UtcNow
        };

        _context.UserPuzzleAttempts.Add(attempt);

        // Update user puzzle rating based on result
        var expectedScore = 1.0 / (1.0 + Math.Pow(10, (puzzle.Rating - user.PuzzleRating) / 400.0));
        var actualScore = solved ? 1.0 : 0.0;
        var kFactor = 32; // Standard K-factor
        
        var ratingChange = (int)Math.Round(kFactor * (actualScore - expectedScore));
        user.PuzzleRating = Math.Max(100, user.PuzzleRating + ratingChange); // Minimum 100 rating

        await _context.SaveChangesAsync();
        return attempt;
    }

    public async Task<List<Puzzle>> GetPuzzlesByThemeAsync(string theme, int count = 10)
    {
        return await _context.Puzzles
            .Where(p => p.Themes.Contains(theme))
            .OrderByDescending(p => p.Popularity)
            .Take(count)
            .ToListAsync();
    }

    public async Task<Dictionary<string, int>> GetUserStatsAsync(int userId)
    {
        var attempts = await _context.UserPuzzleAttempts
            .Where(a => a.UserId == userId)
            .ToListAsync();

        return new Dictionary<string, int>
        {
            ["total"] = attempts.Count,
            ["solved"] = attempts.Count(a => a.Solved),
            ["failed"] = attempts.Count(a => !a.Solved)
        };
    }
}
