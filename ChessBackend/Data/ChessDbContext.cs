using Microsoft.EntityFrameworkCore;
using ChessBackend.Models;

namespace ChessBackend.Data;

public class ChessDbContext : DbContext
{
    public ChessDbContext(DbContextOptions<ChessDbContext> options) : base(options)
    {
    }
    
    public DbSet<User> Users { get; set; }
    public DbSet<Game> Games { get; set; }
    public DbSet<Move> Moves { get; set; }
    public DbSet<GameInvite> GameInvites { get; set; }
    public DbSet<MatchmakingQueue> MatchmakingQueue { get; set; }
    public DbSet<ChatMessage> ChatMessages { get; set; }
    public DbSet<Friendship> Friendships { get; set; }
    public DbSet<Challenge> Challenges { get; set; }
    public DbSet<Puzzle> Puzzles { get; set; }
    public DbSet<UserPuzzleAttempt> UserPuzzleAttempts { get; set; }
    public DbSet<Tournament> Tournaments { get; set; }
    public DbSet<TournamentParticipant> TournamentParticipants { get; set; }
    public DbSet<TournamentMatch> TournamentMatches { get; set; }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.TelegramId).IsUnique();
            entity.HasIndex(u => u.Elo);
            entity.HasIndex(u => u.Username);
        });

        // Tournament configuration
        modelBuilder.Entity<Tournament>(entity =>
        {
            entity.HasIndex(t => t.RoomName).IsUnique();
            entity.HasIndex(t => t.Status);
            entity.HasIndex(t => t.CreatedAt);

            entity.HasOne(t => t.CreatorUser)
                .WithMany()
                .HasForeignKey(t => t.CreatorUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<TournamentParticipant>(entity =>
        {
            entity.HasIndex(tp => new { tp.TournamentId, tp.UserId }).IsUnique();
            entity.HasIndex(tp => new { tp.TournamentId, tp.Seed });

            entity.HasOne(tp => tp.Tournament)
                .WithMany(t => t.Participants)
                .HasForeignKey(tp => tp.TournamentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(tp => tp.User)
                .WithMany()
                .HasForeignKey(tp => tp.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<TournamentMatch>(entity =>
        {
            entity.HasIndex(tm => new { tm.TournamentId, tm.RoundNumber, tm.SlotIndex }).IsUnique();
            entity.HasIndex(tm => tm.GameId);

            entity.HasOne(tm => tm.Tournament)
                .WithMany(t => t.Matches)
                .HasForeignKey(tm => tm.TournamentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(tm => tm.Game)
                .WithMany()
                .HasForeignKey(tm => tm.GameId)
                .OnDelete(DeleteBehavior.SetNull);
        });
        
        // Game configuration
        modelBuilder.Entity<Game>(entity =>
        {
            entity.HasIndex(g => g.Status);
            entity.HasIndex(g => g.CreatedAt);
            
            entity.HasOne(g => g.WhitePlayer)
                .WithMany(u => u.GamesAsWhite)
                .HasForeignKey(g => g.WhitePlayerId)
                .OnDelete(DeleteBehavior.Restrict);
            
            entity.HasOne(g => g.BlackPlayer)
                .WithMany(u => u.GamesAsBlack)
                .HasForeignKey(g => g.BlackPlayerId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        
        // Move configuration
        modelBuilder.Entity<Move>(entity =>
        {
            entity.HasIndex(m => m.GameId);
            entity.HasIndex(m => new { m.GameId, m.MoveNumber });
        });
        
        // GameInvite configuration
        modelBuilder.Entity<GameInvite>(entity =>
        {
            entity.HasIndex(gi => gi.Status);
            entity.HasIndex(gi => gi.ToUserId);
            entity.HasIndex(gi => gi.FromUserId);
            
            entity.HasOne(gi => gi.FromUser)
                .WithMany(u => u.SentInvites)
                .HasForeignKey(gi => gi.FromUserId)
                .OnDelete(DeleteBehavior.Restrict);
            
            entity.HasOne(gi => gi.ToUser)
                .WithMany(u => u.ReceivedInvites)
                .HasForeignKey(gi => gi.ToUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        
        // MatchmakingQueue configuration
        modelBuilder.Entity<MatchmakingQueue>(entity =>
        {
            entity.HasIndex(mq => mq.UserId).IsUnique();
            entity.HasIndex(mq => new { mq.MinElo, mq.MaxElo });
            entity.HasIndex(mq => mq.TimeControl);
        });
        
        // ChatMessage configuration
        modelBuilder.Entity<ChatMessage>(entity =>
        {
            entity.HasIndex(cm => cm.GameId);
            entity.HasIndex(cm => cm.CreatedAt);
            
            entity.HasOne(cm => cm.Game)
                .WithMany()
                .HasForeignKey(cm => cm.GameId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(cm => cm.Player)
                .WithMany()
                .HasForeignKey(cm => cm.PlayerId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        
        // Friendship configuration
        modelBuilder.Entity<Friendship>(entity =>
        {
            entity.HasIndex(f => f.RequesterId);
            entity.HasIndex(f => f.AddresseeId);
            entity.HasIndex(f => f.Status);
            entity.HasIndex(f => new { f.RequesterId, f.AddresseeId }).IsUnique();
            
            entity.HasOne(f => f.Requester)
                .WithMany()
                .HasForeignKey(f => f.RequesterId)
                .OnDelete(DeleteBehavior.Restrict);
            
            entity.HasOne(f => f.Addressee)
                .WithMany()
                .HasForeignKey(f => f.AddresseeId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        
        // Challenge configuration
        modelBuilder.Entity<Challenge>(entity =>
        {
            entity.HasIndex(c => c.ChallengerId);
            entity.HasIndex(c => c.ChallengedId);
            entity.HasIndex(c => c.Status);
            entity.HasIndex(c => c.ExpiresAt);
            
            entity.HasOne(c => c.Challenger)
                .WithMany()
                .HasForeignKey(c => c.ChallengerId)
                .OnDelete(DeleteBehavior.Restrict);
            
            entity.HasOne(c => c.Challenged)
                .WithMany()
                .HasForeignKey(c => c.ChallengedId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        
        // Puzzle configuration
        modelBuilder.Entity<Puzzle>(entity =>
        {
            entity.HasIndex(p => p.Rating);
            entity.HasIndex(p => p.Themes);
        });
        
        // UserPuzzleAttempt configuration
        modelBuilder.Entity<UserPuzzleAttempt>(entity =>
        {
            entity.HasIndex(upa => upa.UserId);
            entity.HasIndex(upa => upa.PuzzleId);
            entity.HasIndex(upa => new { upa.UserId, upa.PuzzleId });
            
            entity.HasOne(upa => upa.User)
                .WithMany()
                .HasForeignKey(upa => upa.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(upa => upa.Puzzle)
                .WithMany()
                .HasForeignKey(upa => upa.PuzzleId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
