using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChessBackend.Models;

public class Tournament
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(64)]
    public string RoomName { get; set; } = string.Empty; // slug-like unique code for joining

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public int CreatorUserId { get; set; }

    [ForeignKey(nameof(CreatorUserId))]
    public User CreatorUser { get; set; } = null!;

    public bool IsPrivate { get; set; } = false;

    [MaxLength(200)]
    public string? PasswordHash { get; set; }

    [MaxLength(50)]
    public string TimeControl { get; set; } = "5+0";

    public int BestOf { get; set; } = 1; // 1 or 3

    public int BreakMinutesBetweenRounds { get; set; } = 5;

    public TournamentStatus Status { get; set; } = TournamentStatus.Draft;

    public int CurrentRound { get; set; } = 0;

    /// <summary>
    /// When set and Status=InProgress, the next round should be generated at/after this time.
    /// </summary>
    public DateTime? RoundReadyAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    public ICollection<TournamentParticipant> Participants { get; set; } = new List<TournamentParticipant>();
    public ICollection<TournamentMatch> Matches { get; set; } = new List<TournamentMatch>();
}

public enum TournamentStatus
{
    Draft = 0,
    Registration = 1,
    InProgress = 2,
    Completed = 3,
    Cancelled = 4
}

