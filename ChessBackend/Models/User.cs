using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChessBackend.Models;

public class User
{
    [Key]
    public int Id { get; set; }
    
    public long? TelegramId { get; set; } // Nullable для обычных пользователей
    
    [Required]
    [MaxLength(100)]
    public string Username { get; set; } = string.Empty;
    
    [MaxLength(255)]
    public string? Email { get; set; }
    
    public string? PasswordHash { get; set; } // Для обычной аутентификации
    
    public bool IsAnonymous { get; set; } = false; // Гостевой аккаунт
    
    public int Elo { get; set; } = 1200;
    
    public int GamesPlayed { get; set; } = 0;
    
    public int Wins { get; set; } = 0;
    
    public int Losses { get; set; } = 0;
    
    public int Draws { get; set; } = 0;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? LastActiveAt { get; set; }
    
    // Navigation properties
    public ICollection<Game> GamesAsWhite { get; set; } = new List<Game>();
    public ICollection<Game> GamesAsBlack { get; set; } = new List<Game>();
    public ICollection<GameInvite> SentInvites { get; set; } = new List<GameInvite>();
    public ICollection<GameInvite> ReceivedInvites { get; set; } = new List<GameInvite>();
}
