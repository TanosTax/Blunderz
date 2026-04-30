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
    
    // Legacy Elo (deprecated, kept for backward compatibility)
    public int Elo { get; set; } = 1200;
    
    // Separate ratings for different time controls
    public int BulletRating { get; set; } = 1200;  // < 3 minutes
    public int BlitzRating { get; set; } = 1200;   // 3-10 minutes
    public int RapidRating { get; set; } = 1200;   // 10-30 minutes
    public int ClassicalRating { get; set; } = 1200; // 30+ minutes
    public int PuzzleRating { get; set; } = 1200;  // Puzzle rating
    
    public int GamesPlayed { get; set; } = 0;
    
    public int Wins { get; set; } = 0;
    
    public int Losses { get; set; } = 0;
    
    public int Draws { get; set; } = 0;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? LastActiveAt { get; set; }
    
    // Helper method to get rating for specific time control
    public int GetRating(string timeControl)
    {
        var category = Helpers.TimeControlHelper.GetCategory(timeControl);
        return category switch
        {
            Helpers.TimeControlHelper.TimeControlCategory.Bullet => BulletRating,
            Helpers.TimeControlHelper.TimeControlCategory.Blitz => BlitzRating,
            Helpers.TimeControlHelper.TimeControlCategory.Rapid => RapidRating,
            Helpers.TimeControlHelper.TimeControlCategory.Classical => ClassicalRating,
            _ => RapidRating
        };
    }
    
    // Helper method to set rating for specific time control
    public void SetRating(string timeControl, int newRating)
    {
        var category = Helpers.TimeControlHelper.GetCategory(timeControl);
        switch (category)
        {
            case Helpers.TimeControlHelper.TimeControlCategory.Bullet:
                BulletRating = newRating;
                break;
            case Helpers.TimeControlHelper.TimeControlCategory.Blitz:
                BlitzRating = newRating;
                break;
            case Helpers.TimeControlHelper.TimeControlCategory.Rapid:
                RapidRating = newRating;
                break;
            case Helpers.TimeControlHelper.TimeControlCategory.Classical:
                ClassicalRating = newRating;
                break;
        }
        
        // Update legacy Elo field for backward compatibility
        Elo = newRating;
    }
    
    // Navigation properties
    public ICollection<Game> GamesAsWhite { get; set; } = new List<Game>();
    public ICollection<Game> GamesAsBlack { get; set; } = new List<Game>();
    public ICollection<GameInvite> SentInvites { get; set; } = new List<GameInvite>();
    public ICollection<GameInvite> ReceivedInvites { get; set; } = new List<GameInvite>();
}
