namespace ChessBackend.Models;

public class ChatMessage
{
    public int Id { get; set; }
    public Guid GameId { get; set; }
    public int PlayerId { get; set; }
    public string Message { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    
    // Navigation properties
    public Game Game { get; set; } = null!;
    public User Player { get; set; } = null!;
}
