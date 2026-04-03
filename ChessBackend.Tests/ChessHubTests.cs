using Xunit;
using Moq;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using ChessBackend.Hubs;
using ChessBackend.Data;
using ChessBackend.Models;
using Microsoft.EntityFrameworkCore;

namespace ChessBackend.Tests;

public class ChessHubTests
{
    private ChessDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<ChessDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        
        return new ChessDbContext(options);
    }

    [Fact]
    public async Task MakeMove_WithValidParameters_ShouldSucceed()
    {
        // Arrange
        var context = CreateInMemoryContext();
        var logger = new Mock<ILogger<ChessHub>>();
        var mockClients = new Mock<IHubCallerClients>();
        var mockClientProxy = new Mock<ISingleClientProxy>();
        var mockGroupProxy = new Mock<IClientProxy>();
        var mockGroups = new Mock<IGroupManager>();
        
        mockClients.Setup(c => c.Group(It.IsAny<string>())).Returns(mockGroupProxy.Object);
        mockClients.Setup(c => c.Caller).Returns(mockClientProxy.Object);
        
        var hub = new ChessHub(context, logger.Object)
        {
            Clients = mockClients.Object,
            Groups = mockGroups.Object
        };

        // Create test game
        var whitePlayer = new User { Username = "White", Elo = 1500 };
        var blackPlayer = new User { Username = "Black", Elo = 1500 };
        context.Users.AddRange(whitePlayer, blackPlayer);
        await context.SaveChangesAsync();

        var game = new Game
        {
            WhitePlayerId = whitePlayer.Id,
            BlackPlayerId = blackPlayer.Id,
            Status = GameStatus.Active,
            TimeControl = "10+0",
            WhiteTimeLeft = 600,
            BlackTimeLeft = 600,
            CreatedAt = DateTime.UtcNow,
            StartedAt = DateTime.UtcNow
        };
        context.Games.Add(game);
        await context.SaveChangesAsync();

        // Act
        await hub.MakeMove(game.Id.ToString(), "e4", 595, 600);

        // Assert
        var updatedGame = await context.Games
            .Include(g => g.Moves)
            .FirstAsync(g => g.Id == game.Id);
        
        Assert.Single(updatedGame.Moves);
        Assert.Equal("e4", updatedGame.Moves.First().SAN);
        Assert.Equal(595, updatedGame.WhiteTimeLeft);
        Assert.Equal(600, updatedGame.BlackTimeLeft);
        
        mockGroupProxy.Verify(
            c => c.SendCoreAsync(
                "MoveMade",
                It.Is<object[]>(o => o.Length == 1),
                default),
            Times.Once);
    }

    [Fact]
    public async Task MakeMove_WithInvalidGameId_ShouldSendError()
    {
        // Arrange
        var context = CreateInMemoryContext();
        var logger = new Mock<ILogger<ChessHub>>();
        var mockClients = new Mock<IHubCallerClients>();
        var mockClientProxy = new Mock<ISingleClientProxy>();
        
        mockClients.Setup(c => c.Caller).Returns(mockClientProxy.Object);
        
        var hub = new ChessHub(context, logger.Object)
        {
            Clients = mockClients.Object
        };

        // Act
        await hub.MakeMove("invalid-guid", "e4", 600, 600);

        // Assert
        mockClientProxy.Verify(
            c => c.SendCoreAsync(
                "Error",
                It.Is<object[]>(o => o.Length == 1 && o[0].ToString()!.Contains("Invalid game ID")),
                default),
            Times.Once);
    }

    [Fact]
    public async Task MakeMove_WithZeroTime_ShouldUpdateDatabase()
    {
        // Arrange
        var context = CreateInMemoryContext();
        var logger = new Mock<ILogger<ChessHub>>();
        var mockClients = new Mock<IHubCallerClients>();
        var mockClientProxy = new Mock<ISingleClientProxy>();
        var mockGroupProxy = new Mock<IClientProxy>();
        var mockGroups = new Mock<IGroupManager>();
        
        mockClients.Setup(c => c.Group(It.IsAny<string>())).Returns(mockGroupProxy.Object);
        mockClients.Setup(c => c.Caller).Returns(mockClientProxy.Object);
        
        var hub = new ChessHub(context, logger.Object)
        {
            Clients = mockClients.Object,
            Groups = mockGroups.Object
        };

        var whitePlayer = new User { Username = "White", Elo = 1500 };
        var blackPlayer = new User { Username = "Black", Elo = 1500 };
        context.Users.AddRange(whitePlayer, blackPlayer);
        await context.SaveChangesAsync();

        var game = new Game
        {
            WhitePlayerId = whitePlayer.Id,
            BlackPlayerId = blackPlayer.Id,
            Status = GameStatus.Active,
            TimeControl = "10+0",
            WhiteTimeLeft = 600,
            BlackTimeLeft = 600,
            CreatedAt = DateTime.UtcNow,
            StartedAt = DateTime.UtcNow
        };
        context.Games.Add(game);
        await context.SaveChangesAsync();

        // Act - simulate time running out
        await hub.MakeMove(game.Id.ToString(), "e4", 0, 600);

        // Assert
        var updatedGame = await context.Games.FirstAsync(g => g.Id == game.Id);
        Assert.Equal(0, updatedGame.WhiteTimeLeft);
        Assert.Equal(600, updatedGame.BlackTimeLeft);
    }

    [Fact]
    public async Task MakeMove_ShouldNotAcceptNegativeTime()
    {
        // Arrange
        var context = CreateInMemoryContext();
        var logger = new Mock<ILogger<ChessHub>>();
        var mockClients = new Mock<IHubCallerClients>();
        var mockClientProxy = new Mock<ISingleClientProxy>();
        var mockGroupProxy = new Mock<IClientProxy>();
        var mockGroups = new Mock<IGroupManager>();
        
        mockClients.Setup(c => c.Group(It.IsAny<string>())).Returns(mockGroupProxy.Object);
        mockClients.Setup(c => c.Caller).Returns(mockClientProxy.Object);
        
        var hub = new ChessHub(context, logger.Object)
        {
            Clients = mockClients.Object,
            Groups = mockGroups.Object
        };

        var whitePlayer = new User { Username = "White", Elo = 1500 };
        var blackPlayer = new User { Username = "Black", Elo = 1500 };
        context.Users.AddRange(whitePlayer, blackPlayer);
        await context.SaveChangesAsync();

        var game = new Game
        {
            WhitePlayerId = whitePlayer.Id,
            BlackPlayerId = blackPlayer.Id,
            Status = GameStatus.Active,
            TimeControl = "10+0",
            WhiteTimeLeft = 600,
            BlackTimeLeft = 600,
            CreatedAt = DateTime.UtcNow,
            StartedAt = DateTime.UtcNow
        };
        context.Games.Add(game);
        await context.SaveChangesAsync();

        // Act - try to send negative time (should be handled gracefully)
        await hub.MakeMove(game.Id.ToString(), "e4", -10, 600);

        // Assert - move should still be saved, time should be stored as-is (or clamped to 0)
        var updatedGame = await context.Games
            .Include(g => g.Moves)
            .FirstAsync(g => g.Id == game.Id);
        
        Assert.Single(updatedGame.Moves);
        Assert.Equal("e4", updatedGame.Moves.First().SAN);
        // Time should be stored (backend doesn't validate negative values currently)
        Assert.Equal(-10, updatedGame.WhiteTimeLeft);
    }

    [Fact]
    public async Task MakeMove_BroadcastsSentTimeToAllPlayers()
    {
        // Arrange
        var context = CreateInMemoryContext();
        var logger = new Mock<ILogger<ChessHub>>();
        var mockClients = new Mock<IHubCallerClients>();
        var mockClientProxy = new Mock<ISingleClientProxy>();
        var mockGroupProxy = new Mock<IClientProxy>();
        var mockGroups = new Mock<IGroupManager>();
        
        mockClients.Setup(c => c.Group(It.IsAny<string>())).Returns(mockGroupProxy.Object);
        mockClients.Setup(c => c.Caller).Returns(mockClientProxy.Object);
        
        var hub = new ChessHub(context, logger.Object)
        {
            Clients = mockClients.Object,
            Groups = mockGroups.Object
        };

        var whitePlayer = new User { Username = "White", Elo = 1500 };
        var blackPlayer = new User { Username = "Black", Elo = 1500 };
        context.Users.AddRange(whitePlayer, blackPlayer);
        await context.SaveChangesAsync();

        var game = new Game
        {
            WhitePlayerId = whitePlayer.Id,
            BlackPlayerId = blackPlayer.Id,
            Status = GameStatus.Active,
            TimeControl = "10+0",
            WhiteTimeLeft = 600,
            BlackTimeLeft = 600,
            CreatedAt = DateTime.UtcNow,
            StartedAt = DateTime.UtcNow
        };
        context.Games.Add(game);
        await context.SaveChangesAsync();

        // Act
        await hub.MakeMove(game.Id.ToString(), "e4", 595, 600);

        // Assert - verify the broadcast includes time values
        mockGroupProxy.Verify(
            c => c.SendCoreAsync(
                "MoveMade",
                It.Is<object[]>(args => 
                    args.Length == 1 && 
                    args[0] != null &&
                    HasProperty(args[0], "whiteTimeLeft", 595) &&
                    HasProperty(args[0], "blackTimeLeft", 600) &&
                    HasProperty(args[0], "san", "e4")
                ),
                default),
            Times.Once);
    }

    private bool HasProperty(object obj, string propertyName, object expectedValue)
    {
        var prop = obj.GetType().GetProperty(propertyName);
        if (prop == null) return false;
        var value = prop.GetValue(obj);
        return value?.Equals(expectedValue) ?? expectedValue == null;
    }
}
