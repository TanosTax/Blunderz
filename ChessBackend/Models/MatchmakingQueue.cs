using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChessBackend.Models;

public class MatchmakingQueue
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    public int UserId { get; set; }
    
    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;
    
    public int MinElo { get; set; }
    
    public int MaxElo { get; set; }
    
    [MaxLength(50)]
    public string TimeControl { get; set; } = "10+0";
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
