using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChessBackend.Models;

public class Game
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public int WhitePlayerId { get; set; }
    
    [ForeignKey(nameof(WhitePlayerId))]
    public User WhitePlayer { get; set; } = null!;
    
    [Required]
    public int BlackPlayerId { get; set; }
    
    [ForeignKey(nameof(BlackPlayerId))]
    public User BlackPlayer { get; set; } = null!;
    
    public string PGN { get; set; } = string.Empty;
    
    public string FEN { get; set; } = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    
    [Required]
    public GameStatus Status { get; set; } = GameStatus.Pending;
    
    public GameResult? Result { get; set; }
    
    [MaxLength(50)]
    public string TimeControl { get; set; } = "10+0"; // 10 min + 0 increment
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? StartedAt { get; set; }
    
    public DateTime? CompletedAt { get; set; }
    
    public int? WinnerId { get; set; }
    
    // Time tracking (in seconds)
    public int WhiteTimeLeft { get; set; } = 600; // 10 minutes default
    public int BlackTimeLeft { get; set; } = 600;
    
    // Disconnect tracking
    public DateTime? WhitePlayerLastSeen { get; set; }
    public DateTime? BlackPlayerLastSeen { get; set; }
    public bool WhitePlayerConnected { get; set; } = false;
    public bool BlackPlayerConnected { get; set; } = false;
    
    // Navigation properties
    public ICollection<Move> Moves { get; set; } = new List<Move>();
}

public enum GameStatus
{
    Pending,
    Active,
    Completed,
    Abandoned
}

public enum GameResult
{
    WhiteWin,
    BlackWin,
    Draw,
    Stalemate,
    Timeout,
    Resignation
}
