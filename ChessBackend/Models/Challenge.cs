namespace ChessBackend.Models;

public enum ChallengeStatus
{
    Pending = 0,
    Accepted = 1,
    Declined = 2,
    Cancelled = 3,
    Expired = 4
}

public class Challenge
{
    public int Id { get; set; }
    public int ChallengerId { get; set; }
    public User Challenger { get; set; } = null!;
    public int ChallengedId { get; set; }
    public User Challenged { get; set; } = null!;
    public string TimeControl { get; set; } = "10+0";
    public ChallengeStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? RespondedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public Guid? GameId { get; set; }
}
