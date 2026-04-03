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
    }
}
