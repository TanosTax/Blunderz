using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChessBackend.Models;

public class TournamentParticipant
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid TournamentId { get; set; }

    [ForeignKey(nameof(TournamentId))]
    public Tournament Tournament { get; set; } = null!;

    [Required]
    public int UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;

    public int Seed { get; set; } = 0;

    public TournamentParticipantStatus Status { get; set; } = TournamentParticipantStatus.Active;

    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}

public enum TournamentParticipantStatus
{
    Active = 0,
    Eliminated = 1,
    Withdrawn = 2
}

