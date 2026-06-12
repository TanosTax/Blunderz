using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChessBackend.Models;

public class TournamentMatch
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid TournamentId { get; set; }

    [ForeignKey(nameof(TournamentId))]
    public Tournament Tournament { get; set; } = null!;

    public int RoundNumber { get; set; } = 1;

    /// <summary>
    /// Index of the pairing within a round (0..N/2-1).
    /// </summary>
    public int SlotIndex { get; set; } = 0;

    public int? PlayerAId { get; set; }

    [ForeignKey(nameof(PlayerAId))]
    public User? PlayerA { get; set; }

    public int? PlayerBId { get; set; }

    [ForeignKey(nameof(PlayerBId))]
    public User? PlayerB { get; set; }

    public int? WinnerId { get; set; }

    [ForeignKey(nameof(WinnerId))]
    public User? Winner { get; set; }

    public TournamentMatchStatus Status { get; set; } = TournamentMatchStatus.Pending;

    public int BestOf { get; set; } = 1; // 1 or 3

    public int AWins { get; set; } = 0;
    public int BWins { get; set; } = 0;

    /// <summary>
    /// Current active game of the match series (bo1/bo3).
    /// </summary>
    public Guid? GameId { get; set; }

    [ForeignKey(nameof(GameId))]
    public Game? Game { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public enum TournamentMatchStatus
{
    Pending = 0,
    InProgress = 1,
    Completed = 2,
    Bye = 3
}

