using Microsoft.AspNetCore.SignalR;
using ChessBackend.Data;
using ChessBackend.Models;
using ChessBackend.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ChessBackend.Hubs;

public class ChessHub : Hub
{
    private readonly ChessDbContext _context;
    private readonly ILogger<ChessHub> _logger;
    private static readonly Dictionary<string, (string gameId, int playerId)> _connectionMap = new();

    public ChessHub(ChessDbContext context, ILogger<ChessHub> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task JoinGame(string gameId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, gameId);
        _logger.LogInformation($"Connection {Context.ConnectionId} joined game {gameId}");
        
        // Initialize LastSeen when player joins
        if (Guid.TryParse(gameId, out var gameGuid))
        {
            var game = await _context.Games.FindAsync(gameGuid);
            if (game != null && game.Status == GameStatus.Active)
            {
                var now = DateTime.UtcNow;
                
                // Initialize LastSeen for both players if not set
                if (!game.WhitePlayerLastSeen.HasValue)
                {
                    game.WhitePlayerLastSeen = now;
                    game.WhitePlayerConnected = true;
                }
                if (!game.BlackPlayerLastSeen.HasValue)
                {
                    game.BlackPlayerLastSeen = now;
                    game.BlackPlayerConnected = true;
                }
                
                await _context.SaveChangesAsync();
            }
        }
    }

    public async Task Heartbeat(string gameId, int playerId)
    {
        if (!Guid.TryParse(gameId, out var gameGuid))
        {
            return;
        }

        var game = await _context.Games.FindAsync(gameGuid);
        if (game != null && game.Status == GameStatus.Active)
        {
            var now = DateTime.UtcNow;

            if (game.WhitePlayerId == playerId)
            {
                game.WhitePlayerConnected = true;
                game.WhitePlayerLastSeen = now;
            }
            else if (game.BlackPlayerId == playerId)
            {
                game.BlackPlayerConnected = true;
                game.BlackPlayerLastSeen = now;
            }

            await _context.SaveChangesAsync();
        }
    }



    public async Task ClaimVictory(string gameId, int winnerId)
    {
        if (!Guid.TryParse(gameId, out var gameGuid))
        {
            await Clients.Caller.SendAsync("Error", "Invalid game ID");
            return;
        }

        var game = await _context.Games
            .Include(g => g.WhitePlayer)
            .Include(g => g.BlackPlayer)
            .FirstOrDefaultAsync(g => g.Id == gameGuid);

        if (game == null)
        {
            await Clients.Caller.SendAsync("Error", "Game not found");
            return;
        }

        if (game.Status != GameStatus.Active)
        {
            await Clients.Caller.SendAsync("Error", "Game is not active");
            return;
        }

        game.Status = GameStatus.Completed;
        game.Result = Models.GameResult.Timeout;
        game.WinnerId = winnerId;
        game.CompletedAt = DateTime.UtcNow;

        var winner = winnerId == game.WhitePlayerId ? game.WhitePlayer : game.BlackPlayer;
        var loser = winnerId == game.WhitePlayerId ? game.BlackPlayer : game.WhitePlayer;

        // Update stats
        winner.GamesPlayed++;
        winner.Wins++;
        loser.GamesPlayed++;
        loser.Losses++;

        // Calculate Elo changes only for ranked games
        var oldWinnerElo = winner.GetRating(game.TimeControl);
        var oldLoserElo = loser.GetRating(game.TimeControl);
        
        if (game.IsRanked)
        {
            var eloResult = winnerId == game.WhitePlayerId 
                ? Interfaces.GameResult.WhiteWin 
                : Interfaces.GameResult.BlackWin;
            
            var eloCalculator = Context.GetHttpContext()?.RequestServices.GetRequiredService<Interfaces.IEloCalculatorService>();
            if (eloCalculator != null)
            {
                var (newWhiteElo, newBlackElo) = eloCalculator.CalculateNewRatings(
                    game.WhitePlayer.GetRating(game.TimeControl), 
                    game.BlackPlayer.GetRating(game.TimeControl), 
                    eloResult,
                    game.WhitePlayerBerserk,
                    game.BlackPlayerBerserk);
                
                game.WhitePlayer.SetRating(game.TimeControl, newWhiteElo);
                game.BlackPlayer.SetRating(game.TimeControl, newBlackElo);
            }
        }

        await _context.SaveChangesAsync();

        var winnerEloChange = game.IsRanked ? winner.GetRating(game.TimeControl) - oldWinnerElo : 0;
        var loserEloChange = game.IsRanked ? loser.GetRating(game.TimeControl) - oldLoserElo : 0;

        await Clients.Group(gameId).SendAsync("GameEnded", new
        {
            result = "timeout",
            winnerId,
            message = "Victory claimed due to opponent disconnect",
            eloChanges = new
            {
                whitePlayerId = game.WhitePlayerId,
                whiteChange = game.WhitePlayerId == winnerId ? winnerEloChange : loserEloChange,
                blackPlayerId = game.BlackPlayerId,
                blackChange = game.BlackPlayerId == winnerId ? winnerEloChange : loserEloChange
            }
        });
        
        // Notify spectators
        await Clients.Group($"spectator_{gameId}").SendAsync("GameEnded", new
        {
            result = "timeout",
            winnerId,
            message = "Victory claimed due to opponent disconnect"
        });

        _logger.LogInformation($"Player {winnerId} claimed victory in game {gameId}");
    }

    public async Task OfferDrawAfterDisconnect(string gameId)
    {
        if (!Guid.TryParse(gameId, out var gameGuid))
        {
            await Clients.Caller.SendAsync("Error", "Invalid game ID");
            return;
        }

        var game = await _context.Games
            .Include(g => g.WhitePlayer)
            .Include(g => g.BlackPlayer)
            .FirstOrDefaultAsync(g => g.Id == gameGuid);

        if (game == null)
        {
            await Clients.Caller.SendAsync("Error", "Game not found");
            return;
        }

        if (game.Status != GameStatus.Active)
        {
            await Clients.Caller.SendAsync("Error", "Game is not active");
            return;
        }

        game.Status = GameStatus.Completed;
        game.Result = Models.GameResult.Draw;
        game.CompletedAt = DateTime.UtcNow;

        game.WhitePlayer.GamesPlayed++;
        game.WhitePlayer.Draws++;
        game.BlackPlayer.GamesPlayed++;
        game.BlackPlayer.Draws++;

        await _context.SaveChangesAsync();

        await Clients.Group(gameId).SendAsync("GameEnded", new
        {
            result = "draw",
            message = "Draw agreed after opponent disconnect",
            eloChanges = new
            {
                whitePlayerId = game.WhitePlayerId,
                whiteChange = 0,
                blackPlayerId = game.BlackPlayerId,
                blackChange = 0
            }
        });
        
        // Notify spectators
        await Clients.Group($"spectator_{gameId}").SendAsync("GameEnded", new
        {
            result = "draw",
            message = "Draw agreed after opponent disconnect"
        });

        _logger.LogInformation($"Draw offered after disconnect in game {gameId}");
    }

    public async Task OfferDraw(string gameId, int playerId)
    {
        if (!Guid.TryParse(gameId, out var gameGuid))
        {
            await Clients.Caller.SendAsync("Error", "Invalid game ID");
            return;
        }

        var game = await _context.Games.FindAsync(gameGuid);
        if (game == null || game.Status != GameStatus.Active)
        {
            await Clients.Caller.SendAsync("Error", "Game not found or not active");
            return;
        }

        // Notify opponent about draw offer
        await Clients.Group(gameId).SendAsync("DrawOffered", new { playerId });
        _logger.LogInformation($"Player {playerId} offered draw in game {gameId}");
    }

    public async Task AcceptDraw(string gameId)
    {
        if (!Guid.TryParse(gameId, out var gameGuid))
        {
            await Clients.Caller.SendAsync("Error", "Invalid game ID");
            return;
        }

        var game = await _context.Games
            .Include(g => g.WhitePlayer)
            .Include(g => g.BlackPlayer)
            .FirstOrDefaultAsync(g => g.Id == gameGuid);

        if (game == null)
        {
            await Clients.Caller.SendAsync("Error", "Game not found");
            return;
        }

        if (game.Status != GameStatus.Active)
        {
            await Clients.Caller.SendAsync("Error", "Game is not active");
            return;
        }

        game.Status = GameStatus.Completed;
        game.Result = Models.GameResult.Draw;
        game.CompletedAt = DateTime.UtcNow;

        game.WhitePlayer.GamesPlayed++;
        game.WhitePlayer.Draws++;
        game.BlackPlayer.GamesPlayed++;
        game.BlackPlayer.Draws++;

        await _context.SaveChangesAsync();

        await Clients.Group(gameId).SendAsync("GameEnded", new
        {
            result = "draw",
            message = "Draw by agreement",
            eloChanges = new
            {
                whitePlayerId = game.WhitePlayerId,
                whiteChange = 0,
                blackPlayerId = game.BlackPlayerId,
                blackChange = 0
            }
        });
        
        // Notify spectators
        await Clients.Group($"spectator_{gameId}").SendAsync("GameEnded", new
        {
            result = "draw",
            message = "Draw by agreement"
        });

        _logger.LogInformation($"Draw accepted in game {gameId}");
    }

    public async Task DeclineDraw(string gameId)
    {
        if (!Guid.TryParse(gameId, out var gameGuid))
        {
            await Clients.Caller.SendAsync("Error", "Invalid game ID");
            return;
        }

        var game = await _context.Games.FindAsync(gameGuid);
        if (game == null || game.Status != GameStatus.Active)
        {
            await Clients.Caller.SendAsync("Error", "Game not found or not active");
            return;
        }

        await Clients.Group(gameId).SendAsync("DrawDeclined");
        _logger.LogInformation($"Draw declined in game {gameId}");
    }


    public async Task LeaveGame(string gameId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, gameId);
        _logger.LogInformation($"Connection {Context.ConnectionId} left game {gameId}");
    }

    public async Task JoinGameAsSpectator(string gameId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"spectator_{gameId}");
        _logger.LogInformation($"Connection {Context.ConnectionId} joined game {gameId} as spectator");
    }

    public async Task LeaveGameAsSpectator(string gameId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"spectator_{gameId}");
        _logger.LogInformation($"Connection {Context.ConnectionId} left game {gameId} as spectator");
    }

    
    public async Task SendChatMessage(string gameId, int playerId, string message)
    {
        if (!Guid.TryParse(gameId, out var gameGuid))
        {
            await Clients.Caller.SendAsync("Error", "Invalid game ID");
            return;
        }

        if (string.IsNullOrWhiteSpace(message) || message.Length > 500)
        {
            await Clients.Caller.SendAsync("Error", "Invalid message");
            return;
        }

        var game = await _context.Games.FindAsync(gameGuid);
        if (game == null)
        {
            await Clients.Caller.SendAsync("Error", "Game not found");
            return;
        }

        // Verify player is part of the game
        if (game.WhitePlayerId != playerId && game.BlackPlayerId != playerId)
        {
            await Clients.Caller.SendAsync("Error", "You are not part of this game");
            return;
        }

        // Simple profanity filter (basic implementation)
        var filteredMessage = FilterProfanity(message);

        // Save message to database
        var chatMessage = new ChatMessage
        {
            GameId = gameGuid,
            PlayerId = playerId,
            Message = filteredMessage,
            CreatedAt = DateTime.UtcNow
        };

        _context.ChatMessages.Add(chatMessage);
        await _context.SaveChangesAsync();

        // Get player username
        var player = await _context.Users.FindAsync(playerId);
        
        // Broadcast message to all players in the game
        await Clients.Group(gameId).SendAsync("ChatMessageReceived", new
        {
            id = chatMessage.Id,
            playerId,
            playerUsername = player?.Username ?? "Unknown",
            message = filteredMessage,
            timestamp = chatMessage.CreatedAt
        });

        _logger.LogInformation($"Chat message sent in game {gameId} by player {playerId}");
    }

    private string FilterProfanity(string message)
    {
        // Basic profanity filter - replace with more sophisticated solution if needed
        var badWords = new[] { "fuck", "shit", "bitch", "ass", "damn", "crap", "piss" };
        var filtered = message;
        
        foreach (var word in badWords)
        {
            filtered = System.Text.RegularExpressions.Regex.Replace(
                filtered, 
                word, 
                new string('*', word.Length), 
                System.Text.RegularExpressions.RegexOptions.IgnoreCase
            );
        }
        
        return filtered;
    }

    public async Task ActivateBerserk(string gameId, int playerId)
    {
        if (!Guid.TryParse(gameId, out var gameGuid))
        {
            await Clients.Caller.SendAsync("Error", "Invalid game ID");
            return;
        }

        var game = await _context.Games
            .Include(g => g.Moves)
            .FirstOrDefaultAsync(g => g.Id == gameGuid);

        if (game == null)
        {
            await Clients.Caller.SendAsync("Error", "Game not found");
            return;
        }

        if (game.Status != GameStatus.Active)
        {
            await Clients.Caller.SendAsync("Error", "Game is not active");
            return;
        }

        // Check if player is part of the game
        bool isWhite = game.WhitePlayerId == playerId;
        bool isBlack = game.BlackPlayerId == playerId;

        if (!isWhite && !isBlack)
        {
            await Clients.Caller.SendAsync("Error", "You are not part of this game");
            return;
        }

        // Check if berserk already activated
        if ((isWhite && game.WhitePlayerBerserk) || (isBlack && game.BlackPlayerBerserk))
        {
            await Clients.Caller.SendAsync("Error", "Berserk already activated");
            return;
        }

        // Check move count - white can activate before first move (moveCount < 1), black before second move (moveCount < 2)
        int moveCount = game.Moves.Count;
        if ((isWhite && moveCount >= 1) || (isBlack && moveCount >= 2))
        {
            await Clients.Caller.SendAsync("Error", "Too late to activate berserk");
            return;
        }

        // Activate berserk and halve time
        if (isWhite)
        {
            game.WhitePlayerBerserk = true;
            game.WhiteTimeLeft = game.WhiteTimeLeft / 2;
        }
        else
        {
            game.BlackPlayerBerserk = true;
            game.BlackTimeLeft = game.BlackTimeLeft / 2;
        }

        await _context.SaveChangesAsync();

        // Broadcast berserk activation to both players
        await Clients.Group(gameId).SendAsync("BerserkActivated", new
        {
            playerId,
            isWhite,
            newTimeLeft = isWhite ? game.WhiteTimeLeft : game.BlackTimeLeft
        });

        _logger.LogInformation($"Player {playerId} activated berserk in game {gameId}");
    }

    public async Task ResignGame(string gameId, int playerId)
    {
        if (!Guid.TryParse(gameId, out var gameGuid))
        {
            await Clients.Caller.SendAsync("Error", "Invalid game ID");
            return;
        }

        var game = await _context.Games
            .Include(g => g.WhitePlayer)
            .Include(g => g.BlackPlayer)
            .Include(g => g.Moves)
            .FirstOrDefaultAsync(g => g.Id == gameGuid);

        if (game == null)
        {
            await Clients.Caller.SendAsync("Error", "Game not found");
            return;
        }

        if (game.Status != GameStatus.Active)
        {
            await Clients.Caller.SendAsync("Error", "Game is not active");
            return;
        }

        // Determine winner (opponent of resigning player)
        int winnerId;
        
        if (game.WhitePlayerId == playerId)
        {
            winnerId = game.BlackPlayerId;
        }
        else
        {
            winnerId = game.WhitePlayerId;
        }

        game.Status = GameStatus.Completed;
        game.Result = Models.GameResult.Resignation;
        game.WinnerId = winnerId;
        game.CompletedAt = DateTime.UtcNow;

        // Update player stats
        var winner = winnerId == game.WhitePlayerId ? game.WhitePlayer : game.BlackPlayer;
        var loser = winnerId == game.WhitePlayerId ? game.BlackPlayer : game.WhitePlayer;

        winner.GamesPlayed++;
        winner.Wins++;
        loser.GamesPlayed++;
        loser.Losses++;

        // Calculate Elo changes only if game is ranked and moves were made
        var oldWinnerElo = winner.GetRating(game.TimeControl);
        var oldLoserElo = loser.GetRating(game.TimeControl);
        var moveCount = game.Moves.Count;
        
        // Only change Elo if game is ranked and at least 2 moves were made (one by each player)
        if (game.IsRanked && moveCount >= 2)
        {
            var eloResult = winnerId == game.WhitePlayerId 
                ? Interfaces.GameResult.WhiteWin 
                : Interfaces.GameResult.BlackWin;
            
            var eloCalculator = Context.GetHttpContext()?.RequestServices.GetRequiredService<Interfaces.IEloCalculatorService>();
            if (eloCalculator != null)
            {
                var (newWhiteElo, newBlackElo) = eloCalculator.CalculateNewRatings(
                    game.WhitePlayer.GetRating(game.TimeControl), 
                    game.BlackPlayer.GetRating(game.TimeControl), 
                    eloResult,
                    game.WhitePlayerBerserk,
                    game.BlackPlayerBerserk);
                
                game.WhitePlayer.SetRating(game.TimeControl, newWhiteElo);
                game.BlackPlayer.SetRating(game.TimeControl, newBlackElo);
            }
        }

        await _context.SaveChangesAsync();

        // Calculate Elo changes only if game is ranked
        var winnerEloChange = game.IsRanked ? winner.GetRating(game.TimeControl) - oldWinnerElo : 0;
        var loserEloChange = game.IsRanked ? loser.GetRating(game.TimeControl) - oldLoserElo : 0;

        _logger.LogInformation($"Game {gameId} ended by resignation. IsRanked: {game.IsRanked}, WinnerEloChange: {winnerEloChange}, LoserEloChange: {loserEloChange}");

        // Notify both players
        await Clients.Group(gameId).SendAsync("GameEnded", new
        {
            result = "resignation",
            winnerId,
            resignedPlayerId = playerId,
            message = !game.IsRanked 
                ? "Game ended by resignation (friendly match - no rating change)"
                : moveCount < 2 
                    ? "Game ended by resignation (no rating change - too few moves)" 
                    : "Game ended by resignation",
            eloChanges = new
            {
                whitePlayerId = game.WhitePlayerId,
                whiteChange = game.WhitePlayerId == winnerId ? winnerEloChange : loserEloChange,
                blackPlayerId = game.BlackPlayerId,
                blackChange = game.BlackPlayerId == winnerId ? winnerEloChange : loserEloChange
            }
        });
        
        // Notify spectators
        await Clients.Group($"spectator_{gameId}").SendAsync("GameEnded", new
        {
            result = "resignation",
            winnerId,
            resignedPlayerId = playerId,
            message = "Game ended by resignation"
        });

        _logger.LogInformation($"Player {playerId} resigned game {gameId}");
    }

    public async Task MakeMove(string gameId, string san, string fen, int whiteTimeLeft, int blackTimeLeft)
    {
        _logger.LogInformation($"=== MakeMove START === gameId={gameId}, san={san}, fen={fen}, whiteTime={whiteTimeLeft}, blackTime={blackTimeLeft}");
        try
        {
            _logger.LogInformation($"MakeMove called: gameId={gameId}, san={san}, fen={fen}, whiteTime={whiteTimeLeft}, blackTime={blackTimeLeft}");
            
            if (string.IsNullOrEmpty(gameId))
            {
                _logger.LogWarning("Game ID is null or empty");
                await Clients.Caller.SendAsync("Error", "Game ID is required");
                return;
            }

            if (string.IsNullOrEmpty(san))
            {
                _logger.LogWarning("SAN is null or empty");
                await Clients.Caller.SendAsync("Error", "Move notation is required");
                return;
            }
            
            if (!Guid.TryParse(gameId, out var gameGuid))
            {
                _logger.LogWarning($"Invalid game ID format: {gameId}");
                await Clients.Caller.SendAsync("Error", "Invalid game ID");
                return;
            }

            _logger.LogInformation($"Fetching game from database: {gameGuid}");
            var game = await _context.Games
                .Include(g => g.Moves)
                .FirstOrDefaultAsync(g => g.Id == gameGuid);

            if (game == null)
            {
                _logger.LogWarning($"Game not found: {gameId}");
                await Clients.Caller.SendAsync("Error", "Game not found");
                return;
            }

            _logger.LogInformation($"Game found: {gameId}, Status: {game.Status}, Moves count: {game.Moves.Count}");

            if (game.Status != GameStatus.Active)
            {
                _logger.LogWarning($"Game is not active: {gameId}, status={game.Status}");
                await Clients.Caller.SendAsync("Error", $"Game is not active (status: {game.Status})");
                return;
            }

            var moveNumber = game.Moves.Count + 1;
            _logger.LogInformation($"Creating move #{moveNumber}");
            
            // Update time in database
            game.WhiteTimeLeft = whiteTimeLeft;
            game.BlackTimeLeft = blackTimeLeft;
            
            var move = new Move
            {
                GameId = gameGuid,
                MoveNumber = moveNumber,
                SAN = san,
                FEN = fen,
                CreatedAt = DateTime.UtcNow
            };

            _context.Moves.Add(move);
            
            _logger.LogInformation("Saving to database...");
            await _context.SaveChangesAsync();
            _logger.LogInformation("Saved successfully");

            // Broadcast move with time to all players and spectators
            await Clients.Group(gameId).SendAsync("MoveMade", new
            {
                moveNumber,
                san,
                whiteTimeLeft,
                blackTimeLeft,
                timestamp = move.CreatedAt
            });
            
            await Clients.Group($"spectator_{gameId}").SendAsync("MoveMade", new
            {
                moveNumber,
                san,
                whiteTimeLeft,
                blackTimeLeft,
                timestamp = move.CreatedAt
            });

            _logger.LogInformation($"Move {san} made in game {gameId}, time: W={whiteTimeLeft}s B={blackTimeLeft}s");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error in MakeMove: gameId={gameId}, san={san}, Message: {ex.Message}, StackTrace: {ex.StackTrace}");
            await Clients.Caller.SendAsync("Error", $"Failed to make move: {ex.Message}");
            throw;
        }
    }

    // Friend system methods
    public async Task JoinUserChannel(int userId)
    {
        var userGroup = $"user_{userId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, userGroup);
        _logger.LogInformation($"User {userId} joined their channel");
    }

    public async Task LeaveUserChannel(int userId)
    {
        var userGroup = $"user_{userId}";
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, userGroup);
        _logger.LogInformation($"User {userId} left their channel");
    }

    public async Task SendFriendRequest(int fromUserId, int toUserId)
    {
        try
        {
            // Check if friendship already exists
            var existingFriendship = await _context.Friendships
                .FirstOrDefaultAsync(f => 
                    (f.RequesterId == fromUserId && f.AddresseeId == toUserId) ||
                    (f.RequesterId == toUserId && f.AddresseeId == fromUserId));

            if (existingFriendship != null)
            {
                await Clients.Caller.SendAsync("Error", "Friend request already exists");
                return;
            }

            var friendship = new Friendship
            {
                RequesterId = fromUserId,
                AddresseeId = toUserId,
                Status = FriendshipStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            _context.Friendships.Add(friendship);
            await _context.SaveChangesAsync();

            // Load user data for notification
            var fromUser = await _context.Users.FindAsync(fromUserId);
            var toUser = await _context.Users.FindAsync(toUserId);

            // Notify the recipient
            await Clients.Group($"user_{toUserId}").SendAsync("FriendRequestReceived", new
            {
                id = friendship.Id,
                fromUserId,
                fromUsername = fromUser?.Username,
                fromElo = fromUser?.Elo ?? 1500,
                createdAt = friendship.CreatedAt
            });

            // Notify sender of success
            await Clients.Caller.SendAsync("FriendRequestSent", new
            {
                id = friendship.Id,
                toUserId,
                toUsername = toUser?.Username,
                toElo = toUser?.Elo ?? 1500,
                status = "pending",
                createdAt = friendship.CreatedAt
            });

            _logger.LogInformation($"Friend request sent from {fromUserId} to {toUserId}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error sending friend request from {fromUserId} to {toUserId}");
            await Clients.Caller.SendAsync("Error", "Failed to send friend request");
        }
    }

    public async Task AcceptFriendRequest(int friendshipId, int userId)
    {
        try
        {
            var friendship = await _context.Friendships
                .Include(f => f.Requester)
                .Include(f => f.Addressee)
                .FirstOrDefaultAsync(f => f.Id == friendshipId);

            if (friendship == null)
            {
                await Clients.Caller.SendAsync("Error", "Friend request not found");
                return;
            }

            // Verify the user is the recipient
            if (friendship.AddresseeId != userId)
            {
                await Clients.Caller.SendAsync("Error", "Unauthorized");
                return;
            }

            friendship.Status = FriendshipStatus.Accepted;
            friendship.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Notify both users
            await Clients.Group($"user_{friendship.RequesterId}").SendAsync("FriendRequestAccepted", new
            {
                friendshipId,
                friendId = friendship.AddresseeId,
                friendUsername = friendship.Addressee.Username,
                friendElo = friendship.Addressee.Elo
            });

            await Clients.Group($"user_{friendship.AddresseeId}").SendAsync("FriendRequestAccepted", new
            {
                friendshipId,
                friendId = friendship.RequesterId,
                friendUsername = friendship.Requester.Username,
                friendElo = friendship.Requester.Elo
            });

            _logger.LogInformation($"Friend request {friendshipId} accepted");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error accepting friend request {friendshipId}");
            await Clients.Caller.SendAsync("Error", "Failed to accept friend request");
        }
    }

    public async Task RejectFriendRequest(int friendshipId, int userId)
    {
        try
        {
            var friendship = await _context.Friendships
                .FirstOrDefaultAsync(f => f.Id == friendshipId);

            if (friendship == null)
            {
                await Clients.Caller.SendAsync("Error", "Friend request not found");
                return;
            }

            // Verify the user is the recipient
            if (friendship.AddresseeId != userId)
            {
                await Clients.Caller.SendAsync("Error", "Unauthorized");
                return;
            }

            _context.Friendships.Remove(friendship);
            await _context.SaveChangesAsync();

            // Notify both users
            await Clients.Group($"user_{friendship.RequesterId}").SendAsync("FriendRequestRejected", new
            {
                friendshipId,
                rejectedBy = userId
            });

            await Clients.Caller.SendAsync("FriendRequestRejected", new
            {
                friendshipId
            });

            _logger.LogInformation($"Friend request {friendshipId} rejected");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error rejecting friend request {friendshipId}");
            await Clients.Caller.SendAsync("Error", "Failed to reject friend request");
        }
    }

    public async Task RemoveFriend(int friendshipId, int userId)
    {
        try
        {
            var friendship = await _context.Friendships
                .FirstOrDefaultAsync(f => f.Id == friendshipId);

            if (friendship == null)
            {
                await Clients.Caller.SendAsync("Error", "Friendship not found");
                return;
            }

            // Verify the user is part of the friendship
            if (friendship.RequesterId != userId && friendship.AddresseeId != userId)
            {
                await Clients.Caller.SendAsync("Error", "Unauthorized");
                return;
            }

            var otherUserId = friendship.RequesterId == userId ? friendship.AddresseeId : friendship.RequesterId;

            _context.Friendships.Remove(friendship);
            await _context.SaveChangesAsync();

            // Notify both users
            await Clients.Group($"user_{friendship.RequesterId}").SendAsync("FriendRemoved", new
            {
                friendshipId,
                removedBy = userId
            });

            await Clients.Group($"user_{friendship.AddresseeId}").SendAsync("FriendRemoved", new
            {
                friendshipId,
                removedBy = userId
            });

            _logger.LogInformation($"Friendship {friendshipId} removed by user {userId}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error removing friendship {friendshipId}");
            await Clients.Caller.SendAsync("Error", "Failed to remove friend");
        }
    }

    // Challenge system methods
    public async Task SendChallenge(int challengerId, int challengedId, string timeControl)
    {
        try
        {
            // Check if users are friends
            var friendship = await _context.Friendships
                .FirstOrDefaultAsync(f => 
                    ((f.RequesterId == challengerId && f.AddresseeId == challengedId) ||
                     (f.RequesterId == challengedId && f.AddresseeId == challengerId)) &&
                    f.Status == FriendshipStatus.Accepted);

            if (friendship == null)
            {
                await Clients.Caller.SendAsync("Error", "You can only challenge friends");
                return;
            }

            var challenge = new Challenge
            {
                ChallengerId = challengerId,
                ChallengedId = challengedId,
                TimeControl = timeControl,
                Status = ChallengeStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddMinutes(5) // 5 minutes to respond
            };

            _context.Challenges.Add(challenge);
            await _context.SaveChangesAsync();

            // Load user data
            var challenger = await _context.Users.FindAsync(challengerId);
            var challenged = await _context.Users.FindAsync(challengedId);

            // Notify the challenged player
            await Clients.Group($"user_{challengedId}").SendAsync("ChallengeReceived", new
            {
                id = challenge.Id,
                challengerId,
                challengerUsername = challenger?.Username,
                challengerElo = challenger?.Elo,
                timeControl,
                expiresAt = challenge.ExpiresAt
            });

            // Notify sender of success
            await Clients.Caller.SendAsync("ChallengeSent", new
            {
                id = challenge.Id,
                challengedId,
                challengedUsername = challenged?.Username,
                challengedElo = challenged?.Elo,
                timeControl,
                expiresAt = challenge.ExpiresAt
            });

            _logger.LogInformation($"Challenge sent from {challengerId} to {challengedId}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error sending challenge from {challengerId} to {challengedId}");
            await Clients.Caller.SendAsync("Error", "Failed to send challenge");
        }
    }

    public async Task AcceptChallenge(int challengeId, int userId)
    {
        try
        {
            _logger.LogInformation($"AcceptChallenge called: challengeId={challengeId}, userId={userId}");
            
            var challenge = await _context.Challenges
                .Include(c => c.Challenger)
                .Include(c => c.Challenged)
                .FirstOrDefaultAsync(c => c.Id == challengeId);

            if (challenge == null)
            {
                _logger.LogWarning($"Challenge not found: {challengeId}");
                await Clients.Caller.SendAsync("Error", "Challenge not found");
                return;
            }

            _logger.LogInformation($"Challenge found: {challengeId}, Status={challenge.Status}, ChallengedId={challenge.ChallengedId}");

            // Verify the user is the challenged player
            if (challenge.ChallengedId != userId)
            {
                _logger.LogWarning($"Unauthorized: userId={userId} is not the challenged player (ChallengedId={challenge.ChallengedId})");
                await Clients.Caller.SendAsync("Error", "Unauthorized");
                return;
            }

            if (challenge.Status != ChallengeStatus.Pending)
            {
                _logger.LogWarning($"Challenge is not pending: {challengeId}, Status={challenge.Status}");
                await Clients.Caller.SendAsync("Error", "Challenge is no longer available");
                return;
            }

            // Check if challenge expired
            if (challenge.ExpiresAt < DateTime.UtcNow)
            {
                _logger.LogWarning($"Challenge expired: {challengeId}, ExpiresAt={challenge.ExpiresAt}");
                challenge.Status = ChallengeStatus.Expired;
                await _context.SaveChangesAsync();
                await Clients.Caller.SendAsync("Error", "Challenge has expired");
                return;
            }

            _logger.LogInformation($"Creating game for challenge {challengeId}");

            // Create a new game (unranked - friendly match)
            var gameService = Context.GetHttpContext()?.RequestServices.GetRequiredService<IGameService>();
            if (gameService == null)
            {
                _logger.LogError("GameService is null");
                await Clients.Caller.SendAsync("Error", "Failed to create game");
                return;
            }

            // Randomly assign colors
            var random = new Random();
            var challengerIsWhite = random.Next(2) == 0;
            
            var whitePlayerId = challengerIsWhite ? challenge.ChallengerId : challenge.ChallengedId;
            var blackPlayerId = challengerIsWhite ? challenge.ChallengedId : challenge.ChallengerId;

            _logger.LogInformation($"Creating game: whitePlayerId={whitePlayerId}, blackPlayerId={blackPlayerId}, timeControl={challenge.TimeControl}");

            var game = await gameService.CreateGameAsync(whitePlayerId, blackPlayerId, challenge.TimeControl, isRanked: false);
            
            if (game == null)
            {
                _logger.LogError($"Failed to create game for challenge {challengeId}");
                await Clients.Caller.SendAsync("Error", "Failed to create game");
                return;
            }
            
            _logger.LogInformation($"Game created: {game.Id}, IsRanked: {game.IsRanked}");

            // Update challenge
            challenge.Status = ChallengeStatus.Accepted;
            challenge.RespondedAt = DateTime.UtcNow;
            challenge.GameId = game.Id;
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Challenge {challengeId} updated, notifying players");

            // Notify both players
            await Clients.Group($"user_{challenge.ChallengerId}").SendAsync("ChallengeAccepted", new
            {
                challengeId,
                gameId = game.Id,
                isWhite = challengerIsWhite
            });

            await Clients.Group($"user_{challenge.ChallengedId}").SendAsync("ChallengeAccepted", new
            {
                challengeId,
                gameId = game.Id,
                isWhite = !challengerIsWhite
            });

            _logger.LogInformation($"Challenge {challengeId} accepted, game {game.Id} created");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error accepting challenge {challengeId}: {ex.Message}");
            await Clients.Caller.SendAsync("Error", $"Failed to accept challenge: {ex.Message}");
        }
    }

    public async Task DeclineChallenge(int challengeId, int userId)
    {
        try
        {
            var challenge = await _context.Challenges
                .FirstOrDefaultAsync(c => c.Id == challengeId);

            if (challenge == null)
            {
                await Clients.Caller.SendAsync("Error", "Challenge not found");
                return;
            }

            // Verify the user is the challenged player
            if (challenge.ChallengedId != userId)
            {
                await Clients.Caller.SendAsync("Error", "Unauthorized");
                return;
            }

            challenge.Status = ChallengeStatus.Declined;
            challenge.RespondedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Notify both players
            await Clients.Group($"user_{challenge.ChallengerId}").SendAsync("ChallengeDeclined", new
            {
                challengeId
            });

            await Clients.Caller.SendAsync("ChallengeDeclined", new
            {
                challengeId
            });

            _logger.LogInformation($"Challenge {challengeId} declined");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error declining challenge {challengeId}");
            await Clients.Caller.SendAsync("Error", "Failed to decline challenge");
        }
    }

    public async Task CancelChallenge(int challengeId, int userId)
    {
        try
        {
            var challenge = await _context.Challenges
                .FirstOrDefaultAsync(c => c.Id == challengeId);

            if (challenge == null)
            {
                await Clients.Caller.SendAsync("Error", "Challenge not found");
                return;
            }

            // Verify the user is the challenger
            if (challenge.ChallengerId != userId)
            {
                await Clients.Caller.SendAsync("Error", "Unauthorized");
                return;
            }

            challenge.Status = ChallengeStatus.Cancelled;
            await _context.SaveChangesAsync();

            // Notify both players
            await Clients.Group($"user_{challenge.ChallengedId}").SendAsync("ChallengeCancelled", new
            {
                challengeId
            });

            await Clients.Caller.SendAsync("ChallengeCancelled", new
            {
                challengeId
            });

            _logger.LogInformation($"Challenge {challengeId} cancelled");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error cancelling challenge {challengeId}");
            await Clients.Caller.SendAsync("Error", "Failed to cancel challenge");
        }
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation($"Client connected: {Context.ConnectionId}");
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation($"Client disconnected: {Context.ConnectionId}");
        
        // Handle disconnect
        if (_connectionMap.TryGetValue(Context.ConnectionId, out var info))
        {
            var (gameId, playerId) = info;
            
            if (Guid.TryParse(gameId, out var gameGuid))
            {
                var game = await _context.Games.FindAsync(gameGuid);
                if (game != null && game.Status == GameStatus.Active)
                {
                    var now = DateTime.UtcNow;
                    
                    if (game.WhitePlayerId == playerId)
                    {
                        game.WhitePlayerConnected = false;
                        game.WhitePlayerLastSeen = now;
                    }
                    else if (game.BlackPlayerId == playerId)
                    {
                        game.BlackPlayerConnected = false;
                        game.BlackPlayerLastSeen = now;
                    }
                    
                    await _context.SaveChangesAsync();
                    
                    // Notify opponent about disconnect
                    await Clients.Group(gameId).SendAsync("PlayerDisconnected", new { playerId, timestamp = now });
                }
            }
            
            _connectionMap.Remove(Context.ConnectionId);
        }
        
        await base.OnDisconnectedAsync(exception);
    }
}
