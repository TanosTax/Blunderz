using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChessBackend.Models;

public class GameInvite
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    public int FromUserId { get; set; }
    
    [ForeignKey(nameof(FromUserId))]
    public User FromUser { get; set; } = null!;
    
    [Required]
    public int ToUserId { get; set; }
    
    [ForeignKey(nameof(ToUserId))]
    public User ToUser { get; set; } = null!;
    
    [Required]
    public InviteStatus Status { get; set; } = InviteStatus.Pending;
    
    [MaxLength(50)]
    public string TimeControl { get; set; } = "10+0";
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? RespondedAt { get; set; }
}

public enum InviteStatus
{
    Pending,
    Accepted,
    Declined,
    Expired
}
