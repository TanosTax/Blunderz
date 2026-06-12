using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChessBackend.Models;

public class Move
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    public Guid GameId { get; set; }
    
    [ForeignKey(nameof(GameId))]
    public Game Game { get; set; } = null!;
    
    [Required]
    public int MoveNumber { get; set; }
    
    [Required]
    [MaxLength(10)]
    public string SAN { get; set; } = string.Empty; // Standard Algebraic Notation (e.g., "e4", "Nf3")
    
    [Required]
    public string FEN { get; set; } = string.Empty; // Board state after move
    
    public int TimeSpentMs { get; set; } = 0; // Time spent on this move in milliseconds
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
