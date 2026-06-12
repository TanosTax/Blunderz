using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ChessBackend.Data;
using ChessBackend.Models;

namespace ChessBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FriendsController : ControllerBase
{
    private readonly ChessDbContext _context;
    private readonly ILogger<FriendsController> _logger;

    public FriendsController(ChessDbContext context, ILogger<FriendsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/friends/{userId}
    [HttpGet("{userId}")]
    public async Task<ActionResult<object>> GetFriends(int userId)
    {
        var friends = await _context.Friendships
            .Where(f => (f.RequesterId == userId || f.AddresseeId == userId) && f.Status == FriendshipStatus.Accepted)
            .Include(f => f.Requester)
            .Include(f => f.Addressee)
            .Select(f => new
            {
                friendshipId = f.Id,
                friend = f.RequesterId == userId ? new
                {
                    id = f.Addressee.Id,
                    username = f.Addressee.Username,
                    elo = f.Addressee.Elo,
                    gamesPlayed = f.Addressee.GamesPlayed
                } : new
                {
                    id = f.Requester.Id,
                    username = f.Requester.Username,
                    elo = f.Requester.Elo,
                    gamesPlayed = f.Requester.GamesPlayed
                },
                since = f.UpdatedAt ?? f.CreatedAt
            })
            .ToListAsync();

        return Ok(friends);
    }

    // GET: api/friends/{userId}/requests
    [HttpGet("{userId}/requests")]
    public async Task<ActionResult<object>> GetFriendRequests(int userId)
    {
        var incoming = await _context.Friendships
            .Where(f => f.AddresseeId == userId && f.Status == FriendshipStatus.Pending)
            .Include(f => f.Requester)
            .Select(f => new
            {
                id = f.Id,
                from = new
                {
                    id = f.Requester.Id,
                    username = f.Requester.Username,
                    elo = f.Requester.Elo
                },
                createdAt = f.CreatedAt
            })
            .ToListAsync();

        var outgoing = await _context.Friendships
            .Where(f => f.RequesterId == userId && f.Status == FriendshipStatus.Pending)
            .Include(f => f.Addressee)
            .Select(f => new
            {
                id = f.Id,
                to = new
                {
                    id = f.Addressee.Id,
                    username = f.Addressee.Username,
                    elo = f.Addressee.Elo
                },
                createdAt = f.CreatedAt
            })
            .ToListAsync();

        return Ok(new { incoming, outgoing });
    }

    // POST: api/friends/request
    [HttpPost("request")]
    public async Task<ActionResult> SendFriendRequest([FromBody] FriendRequestDto request)
    {
        if (request.RequesterId == request.AddresseeId)
        {
            return BadRequest("Cannot send friend request to yourself");
        }

        // Check if users exist
        var requester = await _context.Users.FindAsync(request.RequesterId);
        var addressee = await _context.Users.FindAsync(request.AddresseeId);

        if (requester == null || addressee == null)
        {
            return NotFound("User not found");
        }

        // Check if friendship already exists
        var existing = await _context.Friendships
            .FirstOrDefaultAsync(f =>
                (f.RequesterId == request.RequesterId && f.AddresseeId == request.AddresseeId) ||
                (f.RequesterId == request.AddresseeId && f.AddresseeId == request.RequesterId));

        if (existing != null)
        {
            if (existing.Status == FriendshipStatus.Accepted)
            {
                return BadRequest("Already friends");
            }
            if (existing.Status == FriendshipStatus.Pending)
            {
                return BadRequest("Friend request already sent");
            }
            // If rejected, allow sending again
            existing.Status = FriendshipStatus.Pending;
            existing.RequesterId = request.RequesterId;
            existing.AddresseeId = request.AddresseeId;
            existing.CreatedAt = DateTime.UtcNow;
            existing.UpdatedAt = null;
        }
        else
        {
            var friendship = new Friendship
            {
                RequesterId = request.RequesterId,
                AddresseeId = request.AddresseeId,
                Status = FriendshipStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            _context.Friendships.Add(friendship);
        }

        await _context.SaveChangesAsync();

        return Ok(new { message = "Friend request sent" });
    }

    // POST: api/friends/accept/{friendshipId}
    [HttpPost("accept/{friendshipId}")]
    public async Task<ActionResult> AcceptFriendRequest(int friendshipId)
    {
        var friendship = await _context.Friendships.FindAsync(friendshipId);

        if (friendship == null)
        {
            return NotFound("Friend request not found");
        }

        if (friendship.Status != FriendshipStatus.Pending)
        {
            return BadRequest("Friend request is not pending");
        }

        friendship.Status = FriendshipStatus.Accepted;
        friendship.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Friend request accepted" });
    }

    // POST: api/friends/reject/{friendshipId}
    [HttpPost("reject/{friendshipId}")]
    public async Task<ActionResult> RejectFriendRequest(int friendshipId)
    {
        var friendship = await _context.Friendships.FindAsync(friendshipId);

        if (friendship == null)
        {
            return NotFound("Friend request not found");
        }

        if (friendship.Status != FriendshipStatus.Pending)
        {
            return BadRequest("Friend request is not pending");
        }

        friendship.Status = FriendshipStatus.Rejected;
        friendship.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Friend request rejected" });
    }

    // DELETE: api/friends/{friendshipId}
    [HttpDelete("{friendshipId}")]
    public async Task<ActionResult> RemoveFriend(int friendshipId)
    {
        var friendship = await _context.Friendships.FindAsync(friendshipId);

        if (friendship == null)
        {
            return NotFound("Friendship not found");
        }

        _context.Friendships.Remove(friendship);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Friend removed" });
    }
}

public class FriendRequestDto
{
    public int RequesterId { get; set; }
    public int AddresseeId { get; set; }
}
