namespace ChessBackend.Models;

public class Puzzle
{
    public int Id { get; set; }
    public string Fen { get; set; } = string.Empty;
    public string Moves { get; set; } = string.Empty; // Comma-separated correct moves
    public int Rating { get; set; } = 1500;
    public string Themes { get; set; } = string.Empty; // Comma-separated themes
    public int Popularity { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class UserPuzzleAttempt
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public int PuzzleId { get; set; }
    public Puzzle Puzzle { get; set; } = null!;
    public bool Solved { get; set; }
    public int Attempts { get; set; } = 1;
    public DateTime AttemptedAt { get; set; } = DateTime.UtcNow;
}
